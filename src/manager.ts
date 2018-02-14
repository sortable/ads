import EventEmitter from './event-emitter';
import Service from './service';
import { once } from './util';

/**
 * Manager is the class which implements the public Ads Manager API.
 * It manages the state and workflow of configuring, creating, requesting,
 * and destroying ad units.
 */
export default class Manager extends EventEmitter<SortableAds.EventMap> {
  private setting: SortableAds.Setting = {
    bidderTimeout: 1500, // default
    throttleTimeout: 50, // default
  };
  private HBs: Array<Service<any>> = [];
  private adServer: Service<any> | null = null;
  private throttleTimer: any = null;
  private adConfigMap: { [elementId: string]: SortableAds.AdConfig } = {};
  private requestQueue: { [elementId: string]: true | undefined } = {};
  private requestedAds: { [elementId: string]: true | undefined } = {};
  private isStarted: boolean = false;

  /**
   * Get setting by name.
   */
  public get<K extends keyof SortableAds.Setting>(name: K): SortableAds.Setting[K] {
    return this.setting[name];
  }

  /**
   * Set setting by name and value.
   */
  public set<K extends keyof SortableAds.Setting>(name: K, updatedValue: SortableAds.Setting[K]): void {
    const previousValue = this.setting[name];
    this.setting[name] = updatedValue;
    this.emitEvent('updateSetting', { name, previousValue, updatedValue });
  }

  public defineAds(adConfigs: SortableAds.AdConfig[]): void {
    this.tryCatch('defineAds', () => {
      this.emitEvent('defineAds', { adConfigs });
      for (const adConfig of adConfigs) {
        this.adConfigMap[adConfig.elementId] = adConfig;
      }
    });
  }

  /**
   * Used to request ads for DOM elements by id. This method is throttled,
   * so that individual requests can be aggregated before beginning the process
   * of requesting ads. Ad requests will be queued until `start` is called.
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
      this.sendRequest();
    });
  }

  public getRequestedElementIds() {
    return Object.keys(this.requestedAds);
  }

  public destroyAds(elementIds: string[]) {
    this.tryCatch('destroyAds', () => {
      this.emitEvent('destroyAds', { elementIds });
      elementIds.forEach(elementId => {
        delete this.requestedAds[elementId];
        delete this.requestQueue[elementId];
      });
      for (const HB of this.HBs) {
        HB.destroy(elementIds);
      }
      if (this.adServer) {
        this.adServer.destroy(elementIds);
      }
    });
  }

  /**
   * Proxies to [[Service.loadNewPage]].
   */
  public loadNewPage(): void {
    this.tryCatch('loadNewPage', () => {
      this.emitEvent('loadNewPage', {});
      this.HBs.forEach(hb => hb.loadNewPage());
      if (this.adServer) {
        this.adServer.loadNewPage();
      }
    });
  }

  public use<T>(plugin: SortableAds.GeneralPlugin<T>): void {
    this.tryCatch('usePlugin', () => {
      this.emitEvent('usePlugin', { plugin });
      if (plugin.type === 'headerBidding') {
        this.HBs.push(new Service(this, plugin));
      } else if (plugin.type === 'adServer') {
        if (this.adServer) {
          this.emitEvent('warning', {
            message: 'Can not add Ad Server plugin more than once',
          });
        } else {
          this.adServer = new Service(this, plugin);
        }
      } else {
        throw new Error('Invalid plugin');
      }
    });
  }

  public start(): void {
    this.tryCatch('start', () => {
      if (this.isStarted) {
        return;
      }

      if (!this.adServer) {
        throw new Error('Require ad server plugin to start');
      }

      this.isStarted = true;
      this.emitEvent('start', {});

      // send queued requests
      this.sendRequest();
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

  private sendRequest(): void {
    if (!this.isStarted) {
      return;
    }

    if (this.throttleTimer !== null) {
      return;
    }

    // exit early if we have no ids to request
    if (Object.keys(this.requestQueue).length === 0) {
      return;
    }

    this.throttleTimer = setTimeout(() => {
      this.tryCatch('manager.sendRequestNow', () => {
        this.throttleTimer = null;
        this.sendRequestNow();
      });
    }, this.setting.throttleTimeout);
  }

  /**
   * When sending request, config functions would be called in following order:
   *   1. HB's defineUnit
   *   2. HB's requestHB
   *   3. Ad server's defineUnit
   *   4. HB's beforeRequestAdServer
   *   5. Ad server's requestAdServer
   */
  private sendRequestNow(): void {
    const adServer = this.adServer;
    if (!adServer) {
      throw new Error('attempt to send request without ad server');
    }

    const adConfigs: SortableAds.AdConfig[] = [];
    const elementIds = Object.keys(this.requestQueue);

    for (const elementId of elementIds) {
      if (this.adConfigMap.hasOwnProperty(elementId)) {
        adConfigs.push(this.adConfigMap[elementId]);
      } else {
        this.emitEvent('requestUndefinedAdWarning', {
          elementId,
        });
      }
      delete this.requestQueue[elementId];
    }

    const startTime = Date.now();
    const bidderTimeout = this.setting.bidderTimeout;
    const waitingQueue: Array<Service<any>> = this.HBs.slice();

    const bidsReady = once(() => {
      adServer.waitReady(() => {
        // we need to filter out the destroyed ids
        const activeAdConfigs = adConfigs.filter(ac => this.requestedAds[ac.elementId]);
        if (activeAdConfigs.length === 0) {
          return;
        }

        waitingQueue.forEach(timeoutHB => {
          this.emitEvent('requestBidsTimeout', {
            initReady: timeoutHB.ready,
            plugin: timeoutHB.plugin,
          });
        });

        const gptUnits = adServer.getUnits(activeAdConfigs);

        this.HBs.forEach(hb => {
          hb.beforeRequestAdServer(hb.getUnits(activeAdConfigs));
        });

        adServer.requestAdServer(gptUnits);
      });
    });

    this.HBs.forEach(hb => {
      hb.waitReady(() => {
        const waitingTime = Date.now() - startTime;
        const timeout = bidderTimeout - waitingTime;
        const done = once(() => {
          // remove that index from waitingQueue
          const index = waitingQueue.indexOf(hb);
          if (index >= 0) {
            waitingQueue.splice(index, 1);
          }
          if (waitingQueue.length === 0) {
            bidsReady();
          }
        });

        if (timeout <= 0) {
          // init loading time is too long
          done();
          return;
        }

        // We need to filter out the destroyed ids during this period
        const activeAdConfigs = adConfigs.filter(ac => this.requestedAds[ac.elementId]);
        if (activeAdConfigs.length === 0) {
          done();
          return;
        }

        hb.requestBids(hb.getUnits(activeAdConfigs), timeout, done);
      });
    });

    if (waitingQueue.length === 0) {
      bidsReady();
    } else {
      setTimeout(bidsReady, bidderTimeout + 50); // 50ms as buffer time
    }
  }
}
