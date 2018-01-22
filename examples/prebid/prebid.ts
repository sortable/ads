import * as srtAdsManager from '@sortable/ads';

// Typescript requires that we define the properties we will
// be modifying on existing global objects such as window
interface Window {
  pbjs: any;
  googletag: any;
}

declare var window: Window;

// ads-manager initialization
srtAdsManager.setBidderTimeout(1000);
srtAdsManager.setDebug(true);

function registerPrebid() {
  srtAdsManager.registerHB({
    name: 'prebid',
    init(cb) {
      window.pbjs = window.pbjs || {};
      window.pbjs.que = window.pbjs.que || [];
      window.pbjs.que.push(cb)
    },
    defineUnit(divId) {
      if (divId === 'div-gpt-ad-1460505748561-0') {
        return {
          code: divId,
          sizes: [[300, 250], [300, 600]],
            bids: [{
            bidder: 'appnexus',
            params: {
              placementId: '10433394'
            }
          }]
        }
      } else if (divId === 'div-gpt-ad-1460505661639-0') {
        return {
          code: 'div-gpt-ad-1460505661639-0',
          sizes: [[728, 90], [970, 90]],
          bids: [{
            bidder: 'appnexus',
            params: {
              placementId: '10433394'
            }
          }]
        }
      }
    },
    // make the request to Prebid
    requestHB(context) {
      // IMPORTANT: for HBs, you will want to define context.beforeRequestGPT
      // so that you can set targeting for GPT before sending the request.
      context.beforeRequestGPT = function () {
        window.pbjs.setTargetingForGPTAsync(context.ids);
      };
      window.pbjs.requestBids({
        adUnits: context.units,
        timeout: context.timeout,
        bidsReadyHandler() {
          context.done();
        }
      });
    }
  });
}

function registerGPT() {
  srtAdsManager.registerGPT({
    // initialize GPT here, and call cb() in your GPT command/callback
    init(cb) {
      window.googletag = window.googletag || {};
      window.googletag.cmd = window.googletag.cmd || [];
      window.googletag.cmd.push(() => {
        window.googletag.pubads().disableInitialLoad();
        window.googletag.pubads().enableSingleRequest();
        window.googletag.enableServices();
        cb();
      });
    },
    // define your slots here, and they will be matched with divs by id
    defineUnit(divId) {
      if (divId === 'div-gpt-ad-1460505748561-0') {
        return window.googletag.defineSlot('/19968336/header-bid-tag-0', [[300, 250], [300, 600]], divId).addService(window.googletag.pubads());
      }
    },
    // make the request to GPT
    requestGPT(context) {
      context.newIds.forEach((newIds) => {
        window.googletag.display(newIds);
      });
      window.googletag.pubads().refresh(context.units);
    },
  });
}

// initialize ads-manager, and then request ads by the div id
registerPrebid();
registerGPT();
srtAdsManager.requestAds(['div-gpt-ad-1460505748561-0']);
