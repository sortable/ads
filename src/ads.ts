
export type CallbackFunction = () => void;

export interface Config<T> {
  name?: string;
  onInit: (cb: CallbackFunction) => void;
  onDefineAd: (divId: string) => T|null|undefined;
  onRequestAds: (newSlots: T[], refreshSlots: T[], timeout: number, cb: CallbackFunction) => void;
  onSetTargetingForGPT?: (newSlots: T[], refreshSlots: T[], isRequestTimeout?: boolean) => void;
  onDestroyAds?: (slots: T[]) => void;
  onLoadNewPage?: () => void;
}

class Service<T> {
  private name: string;
  private config: Config<T>;
  private slots: { [index: string]: T };
  private ready: boolean;
  private queue: CallbackFunction[];

  constructor(config: Config<T>, name: string) {
    this.name = name;
    this.config = config;
    this.slots = {};
    this.ready = false;
    this.queue = [];

    this.init();
  }

  public emitError(msg: string, err?: Error) {
    console.error(this.name, msg, err || '');
  }

  public emitWarning(msg: string) {
    console.warn(this.name, msg);
  }

  public init() {
    this.config.onInit(() => {
      this.ready = true;
      this.queue.forEach((cb) => {
        cb();
      });
      this.queue = [];
    });
  }

  public waitReady(cb: CallbackFunction) {
    if (this.ready) {
      cb();
    } else {
      this.queue.push(cb);
    }
  }

  public defineAds(divIds: string[]): [T[], T[]] {
    const newSlots: T[] = [];
    const refreshSlots: T[] = [];
    divIds.forEach((divId) => {
      if (!requestedAds.hasOwnProperty(divId)) {
        // this ad is likely destroyed
        return;
      }
      if (this.slots.hasOwnProperty(divId)) {
        refreshSlots.push(this.slots[divId]);
      } else {
        try {
          const slot = this.config.onDefineAd(divId);
          if (slot !== null && slot !== undefined) {
            this.slots[divId] = slot;
            newSlots.push(slot);
          }
        } catch (e) {
          this.emitWarning('fail to define ad');
        }
      }
    });
    return [newSlots, refreshSlots];
  }

  public requestAds(newSlots: T[], refreshSlots: T[], timeout: number, cb: CallbackFunction) {
    try {
      this.config.onRequestAds(newSlots, refreshSlots, timeout, cb);
    } catch (e) {
      this.emitWarning('fail to request ads');
      cb();
    }
  }

  // even if not all bids ready, HB still have a chance to set targeting
  public setTargetingForGPT(newSlots: T[], refreshSLots: T[], isRequestTimeout: boolean) {
    if (!this.ready) {
      return;
    }
    try {
      if (this.config.onSetTargetingForGPT) {
        this.config.onSetTargetingForGPT(newSlots, refreshSLots, isRequestTimeout);
      }
    } catch (e) {
      this.emitWarning('fail to set targeting');
    }
  }

  public destroyAds(divIds: string[]) {
    if (!this.ready) {
      return;
    }
    try {
      const slots: T[] = [];
      divIds.forEach((divId) => {
        if (this.slots.hasOwnProperty(divId)) {
          slots.push(this.slots[divId]);
          delete this.slots[divId];
        }
      });
      if (this.config.onDestroyAds) {
        this.config.onDestroyAds(slots);
      }
    } catch (e) {
      this.emitWarning('fail to destroy ads');
    }
  }

  public loadNewPage() {
    if (!this.ready) {
      return;
    }
    try {
      if (this.config.onLoadNewPage) {
        this.config.onLoadNewPage();
      }
    } catch (e) {
      this.emitWarning('fail to call new page');
    }
  }
}

let HBs: Array<Service<any>> = [];
let GPT: Service<any>|null = null;

// use object instead of array to remove duplicates
let requestQueue: { [index: string]: number } = {};
let requestedAds: { [index: string]: number } = {};

// timer for request throttle
let requestThrottleTimeout: number|null = null;

let bidderTimeout = 1500; // default
let throttleTimeout = 50; // default

export function getVersion() {
  return '0.0.1';
}

export function getBidderTimeout() {
  return bidderTimeout;
}

export function setBidderTimeout(timeout: number) {
  bidderTimeout = timeout;
}

export function getThrottleTimeout() {
  return throttleTimeout;
}

export function setThrottleTimeout(timeout: number) {
  throttleTimeout = timeout;
}

/**
 * Get the list of requested div ids.
 */
export function getAds(): string[] {
  return Object.keys(requestedAds);
}

/**
 * Command to request given ads.
 * Request the id multiple times would do refresh.
 *
 * We can use `requestAds(getAds())` to refresh all ads
 *
 * @param divIds
 */
export function requestAds(divIds: string[]) {
  divIds.forEach((divId) => {
    requestQueue[divId] = 1;
    requestedAds[divId] = 1;
  });

  // - don't send request until GPT is registered
  if (GPT === null ||
      requestThrottleTimeout !== null ||
      Object.keys(requestQueue).length === 0) {
    return;
  }

  // Now, compiler knows that `gpt` is not null.
  const gpt = GPT;

  requestThrottleTimeout = setTimeout(() => {
    const ids = Object.keys(requestQueue);

    // reset queue
    requestThrottleTimeout = null;
    requestQueue = {};

    const startTime = Date.now();

    const waitingQueue: number[] = [];

    HBs.forEach((hb, bidderId) => {
      waitingQueue.push(bidderId);

      const callback = () => {
        // remove that index from waitingQueue
        const index = waitingQueue.indexOf(bidderId);
        if (index >= 0) {
          waitingQueue.splice(index, 1);
        }
        if (waitingQueue.length === 0) {
          bidsReady();
        }
      };

      hb.waitReady(() => {
        const loadingTime = Date.now() - startTime;
        const timeout = bidderTimeout - loadingTime;

        if (timeout <= 0) {
          // loading time is too long
          callback();
          return;
        }

        const [hbNewSlots, hbRefreshSlots] = hb.defineAds(ids);

        hb.requestAds(hbNewSlots, hbRefreshSlots, timeout, callback);
      });
    });

    setTimeout(() => {
      bidsReady();
    }, bidderTimeout + 100); // 100ms as buffer time

    let calledBidderReady = false;

    function bidsReady() {
      if (calledBidderReady) {
        return;
      }
      calledBidderReady = true;

      gpt.waitReady(() => {
        const [gptNewSlots, gptRefreshSlots] = gpt.defineAds(ids);

        gpt.setTargetingForGPT(gptNewSlots, gptRefreshSlots, false);

        HBs.forEach((hb, hbIndex) => {
          const isRequestTimeout = waitingQueue.indexOf(hbIndex) >= 0;
          if (isRequestTimeout) {
            // something bad happens, some bidder do not be able to do it on time
            // warning that some bidder cannot make it on time
            hb.emitWarning(`Did not callback before timeout`);
          }
          hb.setTargetingForGPT([], [], isRequestTimeout);
        });

        gpt.requestAds(gptNewSlots, gptRefreshSlots, 0, () => { /* noop */ });
      });
    }
  }, throttleTimeout);
}

/*
 * Commnad to destroy given ads.
 *
 * We can use `destroyAds(getAds())` to destroy all ads
 */
export function destroyAds(divIds: string[]) {
  divIds.forEach(divId => {
    delete requestQueue[divId];
    delete requestedAds[divId];
  });
  HBs.forEach(hb => hb.destroyAds(divIds));
  if (GPT) {
    GPT.destroyAds(divIds);
  }
}

/**
 * Command to start a new page view.
 */
export function loadNewPage() {
  HBs.forEach((hb) => hb.loadNewPage());
  if (GPT) {
    GPT.loadNewPage();
  }
}

/**
 * Register GPT setup. The ad manager will queue all requests unitl this is registered.
 *
 * @param GPTConfig
 */
export function registerGPT(config: Config<any>) {
  if (GPT === null) {
    GPT = new Service(config, config.name || 'GPT');

    // GPT is configured, we are ready to send request
    // requestAds with empty array will trigger to execute queued requests
    requestAds([]);
  } else {
    throw new Error('can only register GPT once');
  }
}

/**
 * Register HB Setup.
 *
 * @param name
 * @param HBConfig
 */
export function registerHB(config: Config<any>) {
  HBs.push(new Service(config, config.name || 'HB'));
}

/*
 * Reset internal state, mostly used for test.
 */
export function reset() {
  GPT = null;
  HBs = [];
  requestQueue = {};
  requestedAds = {};
  if (requestThrottleTimeout !== null) {
    clearTimeout(requestThrottleTimeout);
    requestThrottleTimeout = null;
  }
}
