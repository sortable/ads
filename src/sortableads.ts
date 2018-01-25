import Manager from './manager';

const getGlobal = () => {
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  // @ts-ignore: global exists in node.js env
  if (typeof global !== 'undefined') {
    // @ts-ignore: global exists in node.js env
    return global;
  }
  return {}; // we don't care
};

const GLOBAL = getGlobal();
const api: SortableAds.API = GLOBAL.sortableads = GLOBAL.sortableads || [];

if (!api.apiReady) {
  const manager = new Manager();
  api.getVersion = () => '0.0.2';
  api.getDebug = () => manager.getDebug();
  api.setDebug = x => manager.setDebug(x);
  api.getBidderTimeout = () => manager.getBidderTimeout();
  api.setBidderTimeout = x => manager.setBidderTimeout(x);
  api.getAdElementIds = () => manager.getAdElementIds();
  api.requestAds = x => manager.requestAds(x);
  api.destroyAds = x => manager.destroyAds(x);
  api.loadNewPage = () => manager.loadNewPage();
  api.registerGPT = x => manager.registerGPT(x);
  api.registerHB = x => manager.registerHB(x);
  api.addEventListener = (x, y) => manager.addEventListener(x, y);
  api.removeEventListener = (x, y) => manager.removeEventListener(x, y);

  api.apiReady = true;

  // execute all queued operations
  const execute = (fn: () => void) => manager.execute(fn);
  api.push = fn => {
    execute(fn);
    return api.length;
  };
  api.forEach(execute);
  api.splice(0, api.length);
}
