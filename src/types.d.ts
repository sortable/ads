
declare namespace SortableAds {

  type CallbackFunction = () => void;

  interface Context<T> {
    beforeRequestGPT: CallbackFunction | null;
    done: CallbackFunction;
    ids: string[];
    newIds: string[];
    newUnits: T[];
    refreshIds: string[];
    refreshUnits: T[];
    timeout: number;
    units: T[];
  }

  interface Config<T> {
    name: string;
    init: (cb: CallbackFunction) => void;
    defineUnit: (elementId: string) => T | null | undefined;
    destroyUnits?: (units: T[]) => void;
    loadNewPage?: () => void;
  }

  interface GPTConfig<T> extends Config<T> {
    type: 'GPT';
    requestGPT: (context: Context<T>) => void;
  }

  interface HBConfig<T> extends Config<T> {
    type: 'HB';
    requestHB: (context: Context<T>) => void;
  }

  type GeneralConfig<T> = GPTConfig<T> | HBConfig<T>;

  type GoogletagSlot = any;

  interface EventMap {
    'eventListenerError': {
      error: any,
      listener: (event: any) => void,
      type: string,
    },
    'error': {
      error: any,
      message: string,
    },
    'warning': {
      message: string,
    },
    'noUnitDefined': {
      elementId: string,
      name: string,
      type: string,
    },
  }

  type EventKey = keyof EventMap;

  type EventListener<K extends EventKey> = (event: EventMap[K]) => void;

  interface API extends Array<() => void> {
    /**
     * Get version of the SortableAds library
     */
    getVersion(): string;

    /**
     * Get debug flag
     */
    getDebug(): boolean;

    /**
     * Set debug flag
     */
    setDebug(value: boolean): void;

    /**
     * Get bidder timeout in milliseconds
     */
    getBidderTimeout(): number;

    /**
     * Set bidder timeout in milliseconds
     */
    setBidderTimeout(timeout: number): void;

    /**
     * Get the list of element ids for requested ads
     */
    getAdElementIds(): string[];

    /**
     * Request ads for provided element ids
     */
    requestAds(elementIds: string[]): void;

    /**
     * Destroy ads for provided element ids
     */
    detroyAds(elementIds: string[]): void;

    /**
     * Indicate that it's a new page
     */
    loadNewPage(): void;

    /**
     * Register Google Publisher Tag service with provided config
     */
    registerGPT(config: GPTConfig<GoogletagSlot>): void;

    /**
     * Register Header Bidding service with provided config
     */
    registerHB(config: HBConfig<any>): void;

    /**
     * Add listener on specified event
     */
    addEventListener<K extends EventKey>(type: K, listener: EventListener<K>): void;

    /**
     * Remove listener from specified event
     */
    removeEventListener<K extends EventKey>(type: K, listener: EventListener<K>): void;

    /**
     * Indicate that SortableAds API is loaded and ready to use
     */
    apiReady: boolean | undefined;

    /**
     * @param fn The function to run once the sortableads library is loaded
     */
    push(fn: () => void): number;

  }

}

declare var sortableads: SortableAds.API;

declare namespace DeploayAds {

  type AdSize = [number, number];

  interface AdUnit {
    elementId: string;
    sizes: AdSize | AdSize[];
    targeting?: { [index: string]: string | string[] };
    adUnitPath?: string;
  }

  interface RequestBidsParams {
    adUnits: AdUnit[];
    timeout: number;
    bidsReadyHanlder: () => void;
  }

  interface API {
    /**
     * Indicate that DeployAds API is loaded and ready to use
     */
    apiReady: boolean | undefined;

    /**
     * @param fn The function to run once the deployads library is loaded
     */
    push(fn: () => void): number | undefined;

    /**
     * Request bids for the provided AdUnit
     */
    requestBids(params: RequestBidsParams): void;

    /**
     * Set the GPT slot targeting for the received bids
     */
    updateTargetingForGPT(elementIds: string[]): void;

    /**
     * Clean up any resources associated with an AdUnit. Call this when the div is removed from the page.
     */
    destroyAds(elementIds: string[]): void;

    /**
     * Indicate that bids fetched from this point forward are for a new page of a Single Page Application (e.g. using React or Angular).
     * This should be called after the `history.pushState()` has been called to update the url.
     */
    loadNewPage(): void;

  }

}

declare var deployads: DeploayAds.API;
