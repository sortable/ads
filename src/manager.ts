import EventEmitter from './event-emitter';
import Service from './service';

type HBService = Service<any>;
type GPTService = Service<SortableAds.GoogletagSlot>;

// list of events we want to see during debugging
const debugEvents: SortableAds.EventKey[] = [
  'eventListenerError',
  'error',
  'warning',
  'noUnitDefined',
];

export default class Manager extends EventEmitter<SortableAds.EventMap> {
  private bidderTimeout: number;
  private throttleTimeout: number;
  private throttleTimer: any;

  private HBServices: HBService[];
  private GPTService: GPTService | null;

  private requestQueue: { [index: string]: number };
  private requestedAds: { [index: string]: number };

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
      // debug: false => true
      debugEvents.forEach(type => {
        const listener = (event: any) => {
          if (typeof console !== 'undefined' && console.error) {
            console.error('DEBUG', type, event);
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

  public getAdElementIds(): string[] {
    return Object.keys(this.requestedAds);
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
  public requestAds(elementIds: string[]): void {
    elementIds.forEach((divId) => {
      this.requestQueue[divId] = 1;
      this.requestedAds[divId] = 1;
    });

    // - don't send request until GPT is registered
    if (this.GPTService === null ||
        this.throttleTimer !== null ||
        Object.keys(this.requestQueue).length === 0) {
      return;
    }

    // Now, compiler knows that `gpt` is not null.
    const gpt = this.GPTService;

    this.throttleTimer = setTimeout(() => {
      const ids = Object.keys(this.requestQueue);

      // reset queue
      this.throttleTimer = null;
      this.requestQueue = {};

      const startTime = Date.now();

      const waitingQueue: number[] = [];

      const HBServiceAndContexts: Array<[HBService, SortableAds.Context<any>]> = [];

      let calledBidderReady = false;

      const bidsReady = () => {
        if (calledBidderReady) {
          return;
        }
        calledBidderReady = true;

        gpt.waitReady(() => {
          // TODO: some ids are destroyed now ?
          const context = gpt.define(ids);

          HBServiceAndContexts.forEach(([hb, hbContext]) => {
            try {
              if (hbContext.beforeRequestGPT !== null) {
                hbContext.beforeRequestGPT();
              }
            } catch (e) {
              // this.emitError('fail to call beforeRequestGPT');
            }
          });

          gpt.requestGPT(context);
        });
      };

      this.HBServices.forEach((hb, bidderId) => {
        waitingQueue.push(bidderId);

        hb.waitReady(() => {
          const loadingTime = Date.now() - startTime;
          const timeout = this.bidderTimeout - loadingTime;

          // TODO: some ids are destroyed now ?
          const context = hb.define(ids);
          context.timeout = timeout;
          context.done = () => {
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
        setTimeout(() => {
          bidsReady();
        }, this.bidderTimeout + 100); // 100ms as buffer time
      }
    }, this.throttleTimeout);
  }

  /*
   * Commnad to destroy given ads.
   *
   * We can use `destroyAds(getAds())` to destroy all ads
   */
  public destroyAds(elementIds: string[]): void {
    elementIds.forEach(elementid => {
      delete this.requestQueue[elementid];
      delete this.requestedAds[elementid];
    });
    this.HBServices.forEach(hb => hb.destroy(elementIds));
    if (this.GPTService) {
      this.GPTService.destroy(elementIds);
    }
  }

  // destroyAds(null) => to destroyAll ?

  // getUnitByElementId()

  public loadNewPage(): void {
    this.HBServices.forEach(hb => hb.loadNewPage());
    if (this.GPTService) {
      this.GPTService.loadNewPage();
    }
  }

  // ready to create
  public registerGPT(config: SortableAds.GPTConfig<SortableAds.GoogletagSlot>) {
    if (this.GPTService === null) {
      this.GPTService = new Service(config, this); // wait until googletag ready
    } else {
      this.emitEvent('warning', {
        message: 'should only registerGPT once',
      });
    }
  }

  public registerHB(config: SortableAds.HBConfig<any>) {
    this.HBServices.push(new Service(config, this));
  }

  public execute(fn: () => void) {
    try {
      fn();
    } catch (error) {
      this.emitEvent('error', {
        error,
        message: 'exception within function from "sortableads.push(function)"',
      });
    }
  }
}
