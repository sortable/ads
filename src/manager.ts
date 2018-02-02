import EventEmitter from './event-emitter';
import Service from './service';

type HBService = Service<any>;
type GPTService = Service<SortableAds.GoogletagSlot>;

// list of events we want to see during debugging
const debugEvents: SortableAds.EventKey[] = [
  'eventListenerError',
  'error',
  'warning',
  'requestAds',
  'destroyAds',
  'loadNewPage',
  'registerGPT',
  'registerHB',
  'noUnitDefined',
];

export default class Manager extends EventEmitter<SortableAds.EventMap> {
  private bidderTimeout: number;
  private throttleTimeout: number;
  private throttleTimer: any;

  private HBServices: HBService[];
  private GPTService: GPTService | null;

  private requestQueue: { [index: string]: boolean | undefined };
  private requestedAds: { [index: string]: boolean | undefined };

  private debug: boolean;
  private debugListeners: Array<[SortableAds.EventKey, any]>;

  constructor() {
    super();
    this.bidderTimeout = 1500; // default
    this.throttleTimeout = 50; // default
    this.throttleTimer = null;

    this.HBServices = [];
    this.GPTService = null;

    this.requestQueue = {};
    this.requestedAds = {};

    this.debug = false;
    this.debugListeners = [];
  }

  public getDebug(): boolean {
    return this.debug;
  }

  public setDebug(value: boolean) {
    if (value === this.debug) {
      return;
    }
    this.debug = value;
    if (value) {
      const debugPrefix = 'SORTABLEADS';
      // debug: false => true
      debugEvents.forEach(type => {
        const listener = (event: any) => {
          if (typeof console !== 'undefined') {
            if (type.match(/error/) && console.error) {
              console.error(debugPrefix, type, event);
            } else if (type.match(/warning/) && console.warn) {
              console.warn(debugPrefix, type, event);
            } else if (console.log) {
              console.log(debugPrefix, type, event);
            }
          }
        };
        this.addEventListener(type, listener);
        this.debugListeners.push([type, listener]);
      });
    } else {
      // debug: true => false
      this.debugListeners.forEach(l => {
        this.removeEventListener(l[0], l[1]);
      });
      this.debugListeners = [];
    }
  }

  public getBidderTimeout() {
    return this.bidderTimeout;
  }

  public setBidderTimeout(timeout: number) {
    this.bidderTimeout = timeout;
  }

  /**
   * Get all requested ad element ids.
   *
   * Usage:
   *   1. refresh all ads: `requestAds(getRequestedElementIds())`
   *   2. destroy all ads: `destroyAds(getRequestedElementIds())`
   */
  public getRequestedElementIds(): string[] {
    return Object.keys(this.requestedAds);
  }

  /*
   * Commnad to destroy given ads.
   */
  public destroyAds(elementIds: string[]): void {
    this.tryCatch('destroyAds', () => {
      this.emitEvent('destroyAds', { elementIds });
      elementIds.forEach(elementid => {
        delete this.requestQueue[elementid];
        delete this.requestedAds[elementid];
      });
      this.HBServices.forEach(hb => hb.destroy(elementIds));
      if (this.GPTService) {
        this.GPTService.destroy(elementIds);
      }
    });
  }

  public loadNewPage(): void {
    this.tryCatch('loadNewPage', () => {
      this.emitEvent('loadNewPage', {});
      this.HBServices.forEach(hb => hb.loadNewPage());
      if (this.GPTService) {
        this.GPTService.loadNewPage();
      }
    });
  }

  public registerGPT(config: SortableAds.GPTConfig<SortableAds.GoogletagSlot>) {
    this.tryCatch('registerGPT', () => {
      this.emitEvent('registerGPT', { config });
      if (this.GPTService === null) {
        this.GPTService = new Service(this, {
          ...config,
          name: 'googletag',
          type: 'GPT',
        });
        this.requestAds([]);

        // `googletag.disableInitialLoad()` is required to be called
        const win: any = window;
        if (typeof win !== 'undefined') {
          this.GPTService.waitReady(() => {
            setTimeout(() => {
              if (win.googletag && win.googletag.pubadsReady && win.google_DisableInitialLoad === false) {
                const warning = 'Detect that `googletag.disableInitialLoad()` is not called';
                this.emitEvent('warning', {
                  message: warning,
                });
                if (console && console.warn) {
                  console.warn(warning);
                }
              }
            }, 5000);
          });
        }
      } else {
        this.emitEvent('warning', {
          message: 'should only registerGPT once',
        });
      }
    });
  }

  public registerHB(config: SortableAds.HBConfig<any>) {
    this.tryCatch('registerHB', () => {
      this.emitEvent('registerHB', { config });
      this.HBServices.push(new Service(this, {
        ...config,
        name: config.name || 'header bidder',
        type: 'HB',
      }));
    });
  }

  /**
   * Catch all API error and emit error event.
   */
  public tryCatch(name: string, fn: () => void): void {
    try {
      fn();
    } catch (error) {
      this.emitEvent('error', {
        error,
        message: `exception with sortableads.${name}`,
      });
    }
  }

  public requestAds(elementIds: string[]): void {
    this.tryCatch('requestAds', () => {
      this.emitEvent('requestAds', { elementIds });
      elementIds.forEach(elementId => {
        this.requestQueue[elementId] = true;
        this.requestedAds[elementId] = true;
      });

      // wait until GPT is registered
      if (this.GPTService === null ||
          this.throttleTimer !== null ||
          Object.keys(this.requestQueue).length === 0) {
        return;
      }

      // Now, compiler knows that `gpt` is not null.
      const gpt = this.GPTService;

      this.throttleTimer = setTimeout(() => {
        gpt.waitReady(() => {
          this.sendRequest(gpt);
        });
      }, this.throttleTimeout);
    });
  }

  /**
   * When sending request, config functions would be called in following order:
   *   1. GPT's defineUnit
   *   2. HB's defineUnit
   *   3. HB's requestHB
   *   4. HB's context.beforeRequestGPT
   *   5. GPT's requestGPT
   */
  private sendRequest(gpt: GPTService): void {
    const ids = Object.keys(this.requestQueue);

    if (ids.length === 0) {
      return;
    }

    // reset queue
    this.throttleTimer = null;
    this.requestQueue = {};

    const startTime = Date.now();

    const waitingQueue: number[] = [];

    const HBServiceAndContexts: Array<[HBService, SortableAds.HBContext<any>]> = [];

    const gptContext = gpt.define(ids);

    let calledBidsReady = false;

    const bidsReady = () => {
      if (calledBidsReady) {
        return;
      }
      calledBidsReady = true;

      HBServiceAndContexts.forEach(([hb, hbContext]) => {
        hb.executeBeforeRequestGPT(hbContext);
      });

      gpt.requestGPT(gptContext);
    };

    this.HBServices.forEach((hb, bidderId) => {
      waitingQueue.push(bidderId);
    });

    this.HBServices.forEach((hb, bidderId) => {
      hb.waitReady(() => {
        const loadingTime = Date.now() - startTime;
        const timeout = this.bidderTimeout - loadingTime;
        const done = () => {
          // remove that index from waitingQueue
          const index = waitingQueue.indexOf(bidderId);
          if (index >= 0) {
            waitingQueue.splice(index, 1);
          }
          if (waitingQueue.length === 0) {
            bidsReady();
          }
        };

        if (timeout <= 0) {
          // init loading time is too long
          done();
          return;
        }

        // We need to filter out the destroyed ids during this period
        const activeIds = ids.filter(id => this.requestedAds[id]);

        if (activeIds.length === 0) {
          done();
          return;
        }

        const context = hb.define(activeIds);
        const hbContext: SortableAds.HBContext<any> = { ...context, done, timeout, beforeRequestGPT: null };

        HBServiceAndContexts.push([hb, hbContext]);

        hb.requestHB(hbContext);
      });
    });

    if (waitingQueue.length === 0) {
      bidsReady();
    } else {
      setTimeout(() => {
        bidsReady();
      }, this.bidderTimeout + 100); // 100ms as buffer time
    }
  }
}
