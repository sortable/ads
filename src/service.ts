import EventEmitter from './event-emitter';

export default class Service<T> {
  private emitter: EventEmitter<SortableAds.EventMap>;
  private config: SortableAds.GeneralServiceConfig<T>;
  private units: { [index: string]: T };
  private ready: boolean;
  private queue: SortableAds.CallbackFunction[];

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

  public requestHB(context: SortableAds.HBContext<T>) {
    this.tryCatch('requestHB', () => {
      if (this.config.type === 'HB') {
        this.config.requestHB(context);
      }
    });
  }

  public executeBeforeRequestGPT(context: SortableAds.HBContext<T>) {
    this.tryCatch('context.beforeRequestGPT', () => {
      if (context.beforeRequestGPT !== null) {
        context.beforeRequestGPT();
      }
    });
  }

  public requestGPT(context: SortableAds.GPTContext<T>) {
    this.tryCatch('requestGPT', () => {
      if (this.config.type === 'GPT') {
        this.config.requestGPT(context);
      }
    });
  }

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
