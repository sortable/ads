import EventEmitter from './event-emitter';
import { once } from './util';

/**
 * A Service is created when the user load a HB or AdServer plugin,
 * and its main purpose is to generate the context for requests,
 * and to emit events when it proxies to function calls in
 * corresponding the plugin object.
 *
 * As Services are generated in the usage of the Manager API,
 * they should not be manually instantiated.
 */

export default class Service<T> {
  public ready: boolean = false;
  public plugin: SortableAds.GeneralPlugin<T>;

  private emitter: EventEmitter<SortableAds.EventMap>;
  private queue: SortableAds.CallbackFunction[] = [];
  // T => the unit is defined unit for this element id
  // null | undefined => the unit is specified as missed / unused
  private units: { [elementId: string]: T | null | undefined } = {};

  /**
   * Calls plugin.init and provides it with a callback to run all scheduled
   * callbacks added from [[Service.waitReady]] once the service has successfully
   * initialized.
   *
   * @param emitter The instance of Manager that manages the Service.
   * @param plugin The user-defined plugin that the Service will
   * proxy to.
   */
  constructor(
    emitter: EventEmitter<SortableAds.EventMap>,
    plugin: SortableAds.GeneralPlugin<T>,
  ) {
    this.emitter = emitter;
    this.plugin = plugin;

    this.plugin.initAsync(once(() => {
      this.ready = true;
      for (const cb of this.queue) {
        cb();
      }
      this.queue = [];
    }));
  }

  /**
   * The Javascript function {cb} will be queued to run once the Service
   * is initialized. If the Service is already ready, the callback will
   * be run immediately.
   *
   * @param cb A Javascript function.
   */
  public waitReady(cb: SortableAds.CallbackFunction) {
    const wrapped = () => this.tryCatch('waitReady', cb);
    if (this.ready) {
      wrapped();
    } else {
      this.queue.push(wrapped);
    }
  }

  public getUnits(adConfigs: SortableAds.AdConfig[]): T[] {
    if (!this.ready) {
      return [];
    }
    const units: T[] = [];
    for (const adConfig of adConfigs) {
      const elementId = adConfig.elementId;
      if (!this.units.hasOwnProperty(elementId)) {
        this.units[elementId] = null; // default
        this.tryCatch('defineUnit', () => {
          const unit = this.plugin.defineUnit(adConfig);
          this.units[elementId] = unit; // override default
          if (unit == null) {
            this.emitter.emitEvent('noUnitDefined', {
              adConfig,
              plugin: this.plugin,
            });
          }
        });
      }
      const u = this.units[elementId];
      if (u != null) {
        units.push(u);
      }
    }
    return units;
  }

  /**
   * Proxies to plugin.requestHB.
   */
  public requestBids(units: T[], timeout: number, done: SortableAds.CallbackFunction) {
    if (!this.ready) {
      return;
    }
    this.tryCatch('requestBids', () => {
      if (this.plugin.type === 'headerBidding') {
        this.plugin.requestBids(units, timeout, done);
      }
    });
  }

  /**
   * This method is called once all HBs have finished making requests, and before
   * making a request to ad server.
   */
  public beforeRequestAdServer(units: T[]) {
    if (!this.ready) {
      return;
    }
    this.tryCatch('beforeRequestAdServer', () => {
      if (this.plugin.type === 'headerBidding') {
        this.plugin.beforeRequestAdServer(units);
      }
    });
  }

  /**
   * Proxies to plugin.requestGPT.
   */
  public requestAdServer(units: T[]) {
    if (!this.ready) {
      return;
    }
    this.tryCatch('requestAdServer', () => {
      if (this.plugin.type === 'adServer') {
        this.plugin.requestAdServer(units);
      }
    });
  }

  /**
   * Proxies to plugin.destroyUnits.
   *
   * @param elementIds List of divs to destroy their associated ad units.
   */
  public destroy(elementIds: string[]) {
    if (!this.ready) {
      return;
    }
    const units: T[] = [];
    elementIds.forEach(elementId => {
      if (this.units.hasOwnProperty(elementId)) {
        const unit = this.units[elementId];
        if (unit != null) {
          units.push(unit);
        }
        delete this.units[elementId];
      }
    });
    this.tryCatch('destroyUnits', () => {
      if (this.plugin.destroyUnits) {
        this.plugin.destroyUnits(units);
      }
    });
  }

  /**
   * Proxies to plugin.loadNewPage.
   */
  public loadNewPage() {
    if (!this.ready) {
      return;
    }
    this.tryCatch('loadNewPage', () => {
      if (this.plugin.loadNewPage) {
        this.plugin.loadNewPage();
      }
    });
  }

  /**
   * Convenience function used to emit events when
   * exceptions are thrown from methods defined in
   * the plugin object.
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
        message: `${this.plugin.type} (${this.plugin.name}) has exception when call "${name}"`,
      });
    }
  }
}
