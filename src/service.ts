import EventEmitter from './event-emitter';

export default class Service<T> {
  private config: SortableAds.GeneralConfig<T>;
  private units: { [index: string]: T };
  private ready: boolean;
  private queue: SortableAds.CallbackFunction[];
  private emitter: EventEmitter<SortableAds.EventMap>;

  constructor(
    config: SortableAds.GeneralConfig<T>,
    emitter: EventEmitter<SortableAds.EventMap>,
  ) {
    this.config = config;
    this.units = {};
    this.ready = false;
    this.queue = [];
    this.emitter = emitter;

    this.config.init(() => {
      this.ready = true;
      this.queue.forEach((cb) => {
        cb();
      });
      this.queue = [];
    });
  }

  public waitReady(cb: SortableAds.CallbackFunction) {
    if (this.ready) {
      cb();
    } else {
      this.queue.push(cb);
    }
  }

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
        try {
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
        } catch (error) {
          this.emitter.emitEvent('error', {
            error,
            message: 'fail to define ad',
          });
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

  public requestHB(context: SortableAds.Context<T>) {
    try {
      if (this.config.type === 'HB') {
        this.config.requestHB(context);
      }
    } catch (error) {
      this.emitter.emitEvent('error', {
        error,
        message: 'fail to request hb',
      });
      context.done();
    }
  }

  public requestGPT(context: SortableAds.Context<T>) {
    try {
      if (this.config.type === 'GPT') {
        this.config.requestGPT(context);
      }
    } catch (error) {
      this.emitter.emitEvent('error', {
        error,
        message: 'fail to request gpt',
      });
      context.done();
    }
  }

  public destroy(divIds: string[]) {
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
    } catch (error) {
      this.emitter.emitEvent('error', {
        error,
        message: 'fail to destroy ads',
      });
    }
  }

  public loadNewPage() {
    if (!this.ready) {
      return;
    }
    try {
      if (this.config.loadNewPage) {
        this.config.loadNewPage();
      }
    } catch (error) {
      this.emitter.emitEvent('error', {
        error,
        message: 'fail to call new page',
      });
    }
  }
}
