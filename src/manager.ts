import EventEmitter from './event-emitter';
import Service from './service';

type HBService = Service<any>;
type GPTService = Service<SortableAds.GoogletagSlot>;

/**
 * List of events we want to see during debugging.
 */
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

/**
 * Manager is the class which implements the public Ads Manager API.
 * It manages the state and workflow of configuring, creating, requesting,
 * and destroying ad units.
 */
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

  /**
   * Get the debug flag.
   */
  public getDebug(): boolean {
    return this.debug;
  }

  /**
   * Set the debug flag. If debugging is enabled, listeners are registered
   * on certain lifecycle events to log the details.
   */
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

  /**
   * Get the bidder timeout in ms.
   */
  public getBidderTimeout() {
    return this.bidderTimeout;
  }

  /**
   * Set the bidder timeout in ms. It is how long the API waits for
   * header bidders to make their requests before sending the results
   * as targeting to GPT/DFP.
   *
   * @param timeout The bidder timeout in ms.
   */
  public setBidderTimeout(timeout: number) {
    this.bidderTimeout = timeout;
  }

  /**
   * Get all requested ad element ids.
   *
   * Usage:
   *   1. refresh all ads: `requestAds(getRequestedElementIds())`
   *   2. destroy all ads: `destroyAds(getRequestedElementIds())`
   *
   * @returns The list of element ids as strings.
   */
  public getRequestedElementIds(): string[] {
    return Object.keys(this.requestedAds);
  }

  /**
   * Command to destroy given ads.
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

  /**
   * Proxies to [[Service.loadNewPage]].
   */
  public loadNewPage(): void {
    this.tryCatch('loadNewPage', () => {
      this.emitEvent('loadNewPage', {});
      this.HBServices.forEach(hb => hb.loadNewPage());
      if (this.GPTService) {
        this.GPTService.loadNewPage();
      }
    });
  }

  /**
   * Creates a [[Service]] with configuration for GPT, and resumes any queued
   * ad requests. This method should only be called once.
   *
   * @param config A config object for which defineUnits returns a googletag.Slot.
   */
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
        if (typeof window !== 'undefined') {
          this.GPTService.waitReady(() => {
            setTimeout(() => {
              // @ts-ignore
              if (window.googletag && window.googletag.pubadsReady && window.google_DisableInitialLoad === false) {
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

  /**
   * Analagous to registerGPT, but for header bidders.
   *
   * @param config A config object which should return an object which implements
   * an ad unit as specified by the HB Service.
   */
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
   * Convenience function used to emit events when
   * exceptions are thrown from public API calls.
   *
   * @param name The name of the method to include in the error message.
   * @param fn The method to run/wrap.
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

  /**
   * Used to request ads for DOM elements by id. This method is throttled,
   * so that individual requests can be aggregated before beginning the process
   * of requesting ads. Ad requests will be queued until GPT is initialized.
   *
   * @param elementIds The ids for the elements that requested ads should fill
   */
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
   *
   * @param gpt The GPT Service. It needs to exist before we can attempt to send
   * ad requests.
   */
  private sendRequest(gpt: GPTService): void {
    const ids = Object.keys(this.requestQueue);

    // exit early if we have no ids to request
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

        // exit early if all ids were destroyed
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
