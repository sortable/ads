import * as srtAdsManager from '@sortable/ads';

// Typescript requires that we define the properties we will
// be modifying on existing global objects such as window
interface Window {
  googletag: any;
}

declare var window: Window;

// ads-manager initialization
srtAdsManager.setDebug(true);
srtAdsManager.setBidderTimeout(1000);

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
      if (divId === 'test') {
        // the ad unit used here is the example provided by Google for
        // testing GPT on a test page
        return window.googletag.defineSlot('/6355419/Travel/Europe/France/Paris',
          [300, 250], divId).addService(window.googletag.pubads());
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
registerGPT();
srtAdsManager.requestAds(['test']);
