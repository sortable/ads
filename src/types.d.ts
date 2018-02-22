
declare namespace SortableAds {

  type CallbackFunction = () => void;

  type Size = [number, number];
  type GPTSize = Size | 'fluid';
  type GeneralSize<T> = T | T[];

  interface AdConfig {
    elementId: string;
    sizes?: GeneralSize<Size>;

    // for gpt-async plugin
    GPT?: {
      adUnitPath: string;
      sizes?: GeneralSize<GPTSize>; // will use AdConfig.sizes if it's missed
      sizeMapping?: Array<{ viewport: Size, sizes: GeneralSize<GPTSize> }>;
      targeting?: { [key: string]: string | string[] };
      attributes?: { [key: string]: string };
      categoryExclusion?: string;
      clickUrl?: string;
      collapseEmptyDiv?: boolean;
      collapseBeforeAdFetch?: boolean;
      forceSafeFrame?: boolean;
      safeFrameConfig?: {
        allowOverlayExpansion?: boolean;
        allowPushExpansion?: boolean;
        sandbox?: boolean;
      };
    };

    // for prebid-for-gpt-async plugin
    prebid?: {
      sizes?: GeneralSize<Size>; // will use AdConfig.sizes if it's missed
      bids: Array<{
        bidder: string,
        params: any,
        labelAny?: string[],
        labelAll?: string[],
      }>;
      mediaTypes?: any;
      labelAny?: string[];
      labelAll?: string[];
    };

    // for sortable-for-gpt-async plugin
    sortable?: {
      sizes?: GeneralSize<Size>; // will use AdConfig.sizes if it's missed
    };

    // extend ad config for other customized plugin
    // [name: string]: any;
  }

  interface BasicPlugin<T> {
    name: string;
    initAsync: (cb: CallbackFunction) => void;
    defineUnit: (adUnit: AdConfig) => T | null | undefined;
    destroyUnits?: (units: T[]) => void;
    loadNewPage?: () => void;
  }

  interface AdServerPlugin<T> extends BasicPlugin<T> {
    type: 'adServer';
    requestAdServer: (units: T[]) => void;
  }

  interface HeaderBiddingPlugin<T> extends BasicPlugin<T> {
    type: 'headerBidding';
    requestBids: (units: T[], timeout: number, cb: CallbackFunction) => void;
    beforeRequestAdServer: (units: T[]) => void;
  }

  type GeneralPlugin<T> = AdServerPlugin<T> | HeaderBiddingPlugin<T>;

  interface Setting {
    bidderTimeout: number;
    throttleTimeout: number;
    reactVersion: string;
    adsReactVersion: string;
  }

  interface UpdateEvent<T, K extends keyof T> {
    name: K;
    previousValue: T[K];
    updatedValue: T[K];
  }

  interface EventMap {
    'eventListenerError': {
      error: any,
      listener: (event: any) => void,
      type: string,
    };
    'error': {
      error: any,
      message: string,
    };
    'warning': {
      message: string,
    };
    'updateSetting': UpdateEvent<Setting, keyof Setting>;
    'defineAds': {
      adConfigs: AdConfig[],
    };
    'requestAds': {
      elementIds: string[],
    };
    'destroyAds': {
      elementIds: string[],
    };
    'loadNewPage': {},
    'usePlugin': {
      plugin: GeneralPlugin<any>,
    };
    'start': {},
    'noUnitDefined': {
      adConfig: AdConfig,
      plugin: GeneralPlugin<any>,
    };
    'requestUndefinedAdWarning': {
      elementId: string,
    };
    'requestBidsTimeout': {
      initReady: boolean,
      plugin: GeneralPlugin<any>,
    };
  }

  type EventKey = keyof EventMap;

  type EventListener<K extends EventKey> = (event: EventMap[K]) => void;

  interface GPTPluginOption {
    enableSingleRequest?: boolean;
    disableInitialLoad?: boolean;
  }

  interface API extends Array<() => void> {
    /**
     * Get setting with key
     */
    get<K extends keyof Setting>(key: K): Setting[K];

    /**
     * Update setting with key and value
     */
    set<K extends keyof Setting>(key: K, value: Setting[K]): void;

    /**
     * Define ads with provided configuration
     */
    defineAds(adConfigs: AdConfig | AdConfig[]): void;

    /**
     * Request ads for provided element ids
     */
    requestAds(elementIds: string | string[]): void;

    /**
     * Get the list of requested but not destroyed element ids
     */
    getRequestedElementIds(): string[];

    /**
     * Destroy ads for provided element ids
     */
    destroyAds(elementIds: string | string[]): void;

    /**
     * Indicate that it's a new page
     */
    loadNewPage(): void;

    /**
     * Load provided plugin
     */
    use<T>(plugin: GeneralPlugin<T>): void;

    /**
     * Load built-in GPT ad server plugin
     */
    useGPTAsync(option?: GPTPluginOption): void;

    /**
     * Load built-in Prebid HB plugin which is compatible with GPT ad server
     */
    usePrebidForGPTAsync(): void;

    /**
     * Load built-in Sortable HB plugin which is compatible with GPT ad server
     */
    useSortableForGPTAsync(): void;

    /**
     * Start serving ads
     */
    start(): void;

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
     * Specify version of the SortableAds library
     */
    version: string;

    /**
     * @param fn The function to run once the sortableads library is loaded
     */
    push(fn: () => void): number;

  }

}

declare var sortableads: SortableAds.API;

declare namespace DeployAds {

  interface RequestBidsParams {
    timeout: number;
    elementIds: string[];
    readyHandler: () => void;
  }

  interface QueuedEvent {
    timestamp: number;
    source: string;
    name: string;
    args: any[];
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
     * Collect queued events before deployads loaded
     */
    queuedEvents: QueuedEvent[];

    /**
     * @param define ads with provided configs
     */
    defineAds(adConfigs: SortableAds.AdConfig[]): void;

    /**
     * Request bids for the provided parameters.
     */
    requestBidsForGPTAsync(params: RequestBidsParams): void;

    /**
     * Set the GPT slot targeting for the received bids
     */
    setTargetingForGPTAsync(elementIds: string[]): void;

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

declare var deployads: DeployAds.API;
