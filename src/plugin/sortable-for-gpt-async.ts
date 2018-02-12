import { allEvents, deployads, googletag, pbjs, sortableads } from '../util';

const pbjsEvents = [
  'auctionInit',
  'auctionEnd',
  'bidAdjustment',
  'bidTimeout',
  'bidRequested',
  'bidResponse',
  'bidWon',
  'setTargeting',
  'requestBids',
  'addAdUnits',
];

const googletagEvents = [
  'impressionViewable',
  'slotOnload',
  'slotRenderEnded',
  // 'slotVisibilityChanged',
];

export default (): SortableAds.HeaderBiddingPlugin<string> => {
  deployads.queuedEvents = deployads.queuedEvents || [];

  const pushToQueue = (source: string, name: string, args: any[]) => {
    if (deployads.queuedEvents.length <= 2000) {
      deployads.queuedEvents.push({
        timestamp: Date.now(),
        source,
        name,
        args,
      });
    }
  };

  googletag.cmd.push(() => {
    googletagEvents.forEach(name => {
      googletag.pubads().addEventListener(name, (...args: any[]) => {
        pushToQueue('googletag', name, args);
      });
    });
  });

  pbjs.que.push(() => {
    if (!pbjs.onEvent) {
      return; // version too old
    }
    pbjsEvents.forEach(name => {
      pbjs.onEvent(name, (...args: any[]) => {
        pushToQueue('pbjs', name, args);
      });
    });
  });

  sortableads.push(() => {
    allEvents.forEach(name => {
      sortableads.addEventListener(name, (...args: any[]) => {
        pushToQueue('sortableads', name, args);
      });
    });
  });

  return {
    type: 'headerBidding',

    name: 'sortable',

    initAsync: cb => {
      deployads.push(cb);
    },

    defineUnit: adConfig => {
      deployads.defineAds([adConfig]);
      return adConfig.elementId;
    },

    requestBids: (elementIds, timeout, done) => {
      deployads.requestBidsForGPTAsync({
        timeout,
        elementIds,
        readyHandler: () => {
          done();
        },
      });
    },

    beforeRequestAdServer: elementIds => {
      deployads.setTargetingForGPTAsync(elementIds);
    },

    destroyUnits: elementIds => {
      deployads.destroyAds(elementIds);
    },

    loadNewPage: () => {
      deployads.loadNewPage();
    },
  };
};
