import EventEmitter from './event-emitter';

/**
 * A Service is created when the user registers a HB or GPT,
 * and its main purpose is to generate the context for requests,
 * and to emit events when it proxies to function calls in
 * corresponding the Config object.
 *
 * As Services are generated in the usage of the Manager API,
 * they should not be manually instantiated.
 */

export default class Service<T> {
  private emitter: EventEmitter<SortableAds.EventMap>;
  private config: SortableAds.GeneralServiceConfig<T>;
  private units: { [index: string]: T };
  private ready: boolean;
  private queue: SortableAds.CallbackFunction[];

  /**
   * Calls Config.init and provides it with a callback to run all scheduled
   * callbacks added from [[Service.waitReady]] once the service has successfully
   * initialized.
   *
   * @param emitter The instance of Manager that manages the Service.
   * @param config The user-defined Config that the Service will
   * proxy to.
   */
  constructor(
    emitter: EventEmitter<SortableAds.EventMap>,
    config: SortableAds.GeneralServiceConfig<T>,
  ) {
    this.emitter = emitter;
    this.config = config;
    this.units = {};
    this.ready = false;
    this.queue = [];

    this.config.init(() => {
      this.ready = true;
      this.queue.forEach(cb => {
        cb();
      });
      this.queue = [];
    });
  }

  /**
   * The Javascript function {cb} will be queued to run once the Service
   * is initialized. If the Service is already ready, the callback will
   * be run immediately.
   *
   * @param cb A Javascript function.
   */
  public waitReady(cb: SortableAds.CallbackFunction) {
    const wrapped = () => {
      try {
        cb();
      } catch (error) {
        this.emitter.emitEvent('error', {
          error,
          message: `exception with waitReady for ${this.config.type} (${this.config.name})`,
        });
      }
    };
    if (this.ready) {
      wrapped();
    } else {
      this.queue.push(wrapped);
    }
  }

  /**
   * Keep track of new divs to create ad units for (as specified in
   * the Config), and old divs to refresh.
   *
   * @param elementIds List of divIds to define ad units for.
   * @returns The context identifying the ad units to be requested
   * or refreshed.
   */
  public define(elementIds: string[]): SortableAds.Context<T> {
    const newIds: string[] = [];
    const newUnits: T[] = [];
    const refreshIds: string[] = [];
    const refreshUnits: T[] = [];
    elementIds.forEach(elementId => {
      if (this.units.hasOwnProperty(elementId)) {
        refreshIds.push(elementId);
        refreshUnits.push(this.units[elementId]);
      } else {
        this.tryCatch('defineUnit', () => {
          const slot = this.config.defineUnit(elementId);
          if (slot == null) {
            this.emitter.emitEvent('noUnitDefined', {
              elementId,
              name: this.config.name,
              type: this.config.type,
            });
          } else {
            this.units[elementId] = slot;
            newIds.push(elementId);
            newUnits.push(slot);
          }
        });
      }
    });
    return {
      ids: newIds.concat(refreshIds),
      newIds,
      newUnits,
      refreshIds,
      refreshUnits,
      units: newUnits.concat(refreshUnits),
    };
  }

  /**
   * Proxies to Config.requestHB.
   */
  public requestHB(context: SortableAds.HBContext<T>) {
    this.tryCatch('requestHB', () => {
      if (this.config.type === 'HB') {
        this.config.requestHB(context);
      }
    });
  }

  /**
   * This method is called once all HBs have finished making requests, and before
   * making a request to GPT. Context.beforeRequestGPT must be set as a callback
   * on the context in HBConfig.requestHB before making the request. Usually, this
   * is where you set targeting for your ad slots.
   *
   * @param context
   */
  public executeBeforeRequestGPT(context: SortableAds.HBContext<T>) {
    this.tryCatch('context.beforeRequestGPT', () => {
      if (context.beforeRequestGPT !== null) {
        context.beforeRequestGPT();
      }
    });
  }

  /**
   * Proxies to Config.requestGPT.
   */
  public requestGPT(context: SortableAds.GPTContext<T>) {
    this.tryCatch('requestGPT', () => {
      if (this.config.type === 'GPT') {
        this.config.requestGPT(context);
      }
    });
  }

  /**
   * Proxies to Config.destroyUnits.
   *
   * @param divIds List of divs to destroy their associated ad units.
   */
  public destroy(divIds: string[]) {
    if (!this.ready) {
      return;
    }
    const units: T[] = [];
    divIds.forEach(divId => {
      if (this.units.hasOwnProperty(divId)) {
        units.push(this.units[divId]);
        delete this.units[divId];
      }
    });
    this.tryCatch('destroyUnits', () => {
      if (this.config.destroyUnits) {
        this.config.destroyUnits(units);
      }
    });
  }

  /**
   * Proxies to Config.loadNewPage.
   */
  public loadNewPage() {
    if (!this.ready) {
      return;
    }
    this.tryCatch('loadNewPage', () => {
      if (this.config.loadNewPage) {
        this.config.loadNewPage();
      }
    });
  }

  /**
   * Convenience function used to emit events when
   * exceptions are thrown from methods defined in
   * the Config object.
   *
   * @param name The name of the method to include in the error message.
   * @param fn The method to run/wrap.
   */
  private tryCatch(name: string, fn: () => void): void {
    try {
      fn();
    } catch (error) {
      this.emitter.emitEvent('error', {
        error,
        message: `${this.config.type} (${this.config.name}) has exception when call ${name}`,
      });
    }
  }
}
