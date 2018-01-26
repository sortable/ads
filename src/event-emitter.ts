export default class EventEmitter<T extends SortableAds.EventMap> {
  private map: {
    [P in keyof T]?: Array<(event: T[P]) => void>
  };

  constructor() {
    this.map = {};
  }

  public addEventListener<K extends keyof T>(type: K, listener: (event: T[K]) => void) {
    const listeners = this.map[type];
    if (listeners) {
      listeners.push(listener);
    } else {
      this.map[type] = [listener];
    }
  }

  public removeEventListener<K extends keyof T>(type: K, listener: (event: T[K]) => void) {
    const listeners = this.map[type];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    }
  }

  public emitEvent<K extends keyof T>(type: K, event: T[K]) {
    const listeners = this.map[type];
    if (!listeners || listeners.length === 0) {
      return;
    }
    for (const listener of listeners.slice()) {
      try {
        listener(event);
      } catch (error) {
        if (type !== 'eventListenerError') {
          this.emitEvent('eventListenerError',  {
            error,
            listener,
            type,
          });
        }
      }
    }
  }
}
