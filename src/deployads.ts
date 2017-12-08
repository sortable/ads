
/**
 * Sortable Container API
 */

declare module DeployAds {

  interface CommandQueue {
    /**
     * Command queue
     * @param fn The function to run once the library is loaded
     */
    push(fn:(da?: DeployAds) => void): void;
  }

  /** Size of an Ad placement. */
  type AdSize = Array<number>;

  /**
   * The ID of the placement on a page.
   * IDs should be unique for every placement on the page.
   * IDs should be constant after a placement is refreshed.
   */
  type AdId = string

  /** Definition of an AdUnit */
  interface AdUnit {
    /** The id of the AdUnit. */
    divId: AdId;
    /** The sizes of the AdUnit */
    sizes: Array<AdSize>;
  }

  /**
   * Parameter for DeployAds.requestBids
   */
  interface RequestBidsParams {
    /** Ad Units to request bids for */
    adUnits: Array<AdUnit>;
    /** Callback when the bids are received or a timeout occurs */
    bidsReadyHandler: () => void;
  }

  interface DeployAds {
    /**
     * Request bids for the provided AdUnit
     */
    requestBids(params: RequestBidsParams): void;

    /**
     * Set the GPT slot targeting for the received bids
     */
    setTargetingForGPTAsync(ids: Array<AdId>): void;

    /**
     * Clean up any resources associated with an AdUnit. Call this when the div is removed from the page.
     */
    destroyAds(ids: Array<AdId>): void;

    /**
     * Indicate that bids fetched from this point forward are for a new page of a Single Page Application (e.g. using React or Angular).
     * This should be called after the `history.pushState()` has been called to update the url.
     */
    newPage(): void;
  }
}

declare let deployads: DeployAds.CommandQueue;

export default deployads;

