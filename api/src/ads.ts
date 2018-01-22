let debug = false;

export function setDebug(dbg: boolean) {
  debug = dbg;
}

function log(msg: string, args: any[] = []) {
  if (debug) {
    console.log('LOG: ' + msg);
    for (const arg of args) {
      console.log(arg);
    }
  }
}

export type CallbackFunction = () => void;

export interface Context<T> {
  beforeRequestGPT: CallbackFunction|null;
  done: CallbackFunction;
  ids: string[];
  newIds: string[];
  newUnits: T[];
  refreshIds: string[];
  refreshUnits: T[];
  timeout: number;
  units: T[];
}

/**
 * When requestAds API is triggered, config functions
 * will be called in following order:
 *   1. HB's defineUnit
 *   2. HB's requestHB
 *   3. GPT's defineUnit
 *   4. HB's context.beforeRequestGPT
 *   5. GPT's requestGPT
 */
export interface Config<T> {
  name?: string;
  init: (cb: CallbackFunction) => void;
  defineUnit: (divId: string) => T|null|undefined;
  requestHB?: (context: Context<T>) => void;
  requestGPT?: (context: Context<T>) => void;
  destroyUnits?: (units: T[]) => void;
  loadNewPage?: () => void;
}

class Service<T> {
  private name: string;
  private config: Config<T>;
  private units: { [index: string]: T };
  private ready: boolean;
  private queue: CallbackFunction[];

  constructor(config: Config<T>, name: string) {
    log('Creating Service ' + name);
    this.name = name;
    this.config = config;
    this.units = {};
    this.ready = false;
    this.queue = [];

    this.config.init(() => {
      this.ready = true;
      this.queue.forEach((cb) => {
        cb();
      });
      this.queue = [];
    });
  }

  public emitError(msg: string, err?: Error) {
    console.error(this.name, msg, err || '');
  }

  public emitWarning(msg: string) {
    console.warn(this.name, msg);
  }

  public waitReady(cb: CallbackFunction) {
    if (this.ready) {
      cb();
    } else {
      this.queue.push(cb);
    }
  }

  public define(divIds: string[]): Context<T> {
    log('Service define divs:', [divIds]);
    const newIds: string[] = [];
    const newUnits: T[] = [];
    const refreshIds: string[] = [];
    const refreshUnits: T[] = [];
    divIds.forEach((divId) => {
      if (!requestedAds.hasOwnProperty(divId)) {
        // this ad is likely destroyed
        return;
      }
      if (this.units.hasOwnProperty(divId)) {
        refreshUnits.push(this.units[divId]);
        refreshIds.push(divId);
      } else {
        try {
          const slot = this.config.defineUnit(divId);
          if (slot !== null && slot !== undefined) {
            this.units[divId] = slot;
            newUnits.push(slot);
            newIds.push(divId);
          }
        } catch (e) {
          this.emitWarning('fail to define ad');
        }
      }
    });
    return {
      beforeRequestGPT: null,
      done: () => { /* noop */ },
      ids: newIds.concat(refreshIds),
      newIds,
      newUnits,
      refreshIds,
      refreshUnits,
      timeout: 0,
      units: newUnits.concat(refreshUnits),
    };
  }

  public requestHB(context: Context<T>) {
    log('Service requesting HB with context:', [context]);
    try {
      if (this.config.requestHB != null) {
        this.config.requestHB(context);
      }
    } catch (e) {
      this.emitWarning('fail to request hb');
      context.done();
    }
  }

  public requestGPT(context: Context<T>) {
    log('Service requesting GPT with context:', [context]);
    try {
      if (this.config.requestGPT != null) {
        this.config.requestGPT(context);
      }
    } catch (e) {
      this.emitWarning('fail to request gpt');
      context.done();
    }
  }

  public destroy(divIds: string[]) {
    log('Service destroying divs:', [divIds]);
    if (!this.ready) {
      return;
    }
    try {
      const units: T[] = [];
      divIds.forEach((divId) => {
        if (this.units.hasOwnProperty(divId)) {
          units.push(this.units[divId]);
          delete this.units[divId];
        }
      });
      if (this.config.destroyUnits) {
        this.config.destroyUnits(units);
      }
    } catch (e) {
      this.emitWarning('fail to destroy ads');
    }
  }

  public loadNewPage() {
    log('Service loading new page');
    if (!this.ready) {
      return;
    }
    try {
      if (this.config.loadNewPage) {
        this.config.loadNewPage();
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
  log('Requesting ads for divs:', [divIds]);
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

  requestThrottleTimeout = window.setTimeout(() => {
    const ids = Object.keys(requestQueue);

    // reset queue
    requestThrottleTimeout = null;
    requestQueue = {};

    const startTime = Date.now();

    const waitingQueue: number[] = [];

    const HBServiceAndContexts: Array<[Service<any>, Context<any>]> = [];

    let calledBidderReady = false;

    log('Request ads from HBs');
    HBs.forEach((hb, bidderId) => {
      waitingQueue.push(bidderId);

      hb.waitReady(() => {
        log('HB ready');
        const loadingTime = Date.now() - startTime;
        const timeout = bidderTimeout - loadingTime;

        const context = hb.define(ids);
        context.timeout = timeout;
        context.done = () => {
          // make it async to avoid race condition
          setTimeout(() => {
            // remove that index from waitingQueue
            const index = waitingQueue.indexOf(bidderId);
            if (index >= 0) {
              waitingQueue.splice(index, 1);
            }
            if (waitingQueue.length === 0) {
              bidsReady();
            }
          }, 0);
        };

        if (timeout <= 0) {
          // init loading time is too long
          context.done();
          return;
        }

        HBServiceAndContexts.push([hb, context]);

        hb.requestHB(context);
      });
    });

    if (waitingQueue.length === 0) {
      bidsReady();
    } else {
      window.setTimeout(() => {
        bidsReady();
      }, bidderTimeout + 100); // 100ms as buffer time
    }

    function bidsReady() {
      if (calledBidderReady) {
        return;
      }
      calledBidderReady = true;

      log('Request ads from GPT');
      gpt.waitReady(() => {
        log('GPT ready');
        const context = gpt.define(ids);

        HBServiceAndContexts.forEach(([HBService, HBContext]) => {
          try {
            if (HBContext.beforeRequestGPT !== null) {
              HBContext.beforeRequestGPT();
            }
          } catch (e) {
            HBService.emitWarning('fail to call beforeRequestGPT');
          }
        });

        gpt.requestGPT(context);
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
  HBs.forEach(hb => hb.destroy(divIds));
  if (GPT) {
    GPT.destroy(divIds);
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
