import { pbjs } from '../util';

export default (): SortableAds.HeaderBiddingPlugin<string> => {
  return {
    type: 'headerBidding',

    name: 'prebid',

    initAsync: cb => {
      pbjs.que.push(cb);
    },

    defineUnit: adConfig => {
      const prebid = adConfig.prebid;
      if (!prebid) {
        return;
      }
      const pbjsAdUnit = {
        sizes: adConfig.sizes,
        ...prebid,
        code: adConfig.elementId, // always override `code` with elementId
      };
      pbjs.addAdUnits([pbjsAdUnit]);
      return pbjsAdUnit.code;
    },

    requestBids: (adUnitCodes, timeout, done) => {
      pbjs.requestBids({
        timeout,
        adUnitCodes,
        bidsBackHandler: () => {
          done();
        },
      });
    },

    beforeRequestAdServer: adUnitCodes => {
      pbjs.setTargetingForGPTAsync(adUnitCodes);
    },

    destroyUnits: adUnitCodes => {
      for (const adUnitCode of adUnitCodes) {
        pbjs.removeAdUnit(adUnitCode);
      }
    },
  };
};
