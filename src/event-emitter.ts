/**
 * EventEmitter is a pub-sub implementation used to notify event listeners on specific
 * event types that return an associated event structure. The event types and structures
 * can be found in types.d.ts under SortableAds.EventMap, but you can extend this to add
 * new event types. This is mostly useful for debugging in Manager.
 */
export default class EventEmitter<T extends SortableAds.EventMap> {
  private map: { [P in keyof T]?: Array<(event: T[P]) => void> } = {};

  /**
   * Register a listener that allows you to set up and call a Javascript function when
   * an event of type {type} is emitted through [[EventEmitter.emitEvent]]. It is possible
   * to register multiple listeners on the same event type.
   *
   * @param type An event type is a string that must be a key of SortableAds.EventMap
   * @param listener A function which receives an event as a parameter and implements
   * the interface as specified by SortableAds.EventMap[{type}]
   */
  public addEventListener<K extends keyof T>(type: K, listener: (event: T[K]) => void) {
    const listeners = this.map[type];
    if (listeners) {
      listeners.push(listener);
    } else {
      this.map[type] = [listener];
    }
  }

  /**
   * De-register the listener {listener} if and only if it has previously been registered
   * through [[EventEmitter.addEventListener]].
   *
   * @param type An event type is a string that must be a key of SortableAds.EventMap
   * @param listener A function which receives an event as a parameter and implements
   * the interface as specified by SortableAds.EventMap[{type}]
   */
  public removeEventListener<K extends keyof T>(type: K, listener: (event: T[K]) => void) {
    const listeners = this.map[type];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Fires an event and notifies all registered listeners for the event type given.
   * It handles exceptions within event listeners, and ensures other event listeners
   * will be notified sucessfully.
   *
   * @param type An event type is a string that must be a key of SortableAds.EventMap
   * @param event An event is an object implementing the interface specified by
   * SortableAds.EventMap[{type}]
   */
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
