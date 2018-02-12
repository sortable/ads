const getGlobal = (): any => {
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

export const sortableads: SortableAds.API = GLOBAL.sortableads = GLOBAL.sortableads || [];

export const deployads: DeployAds.API = GLOBAL.deployads = GLOBAL.deployads || [];

export const pbjs: any = GLOBAL.pbjs = GLOBAL.pbjs || {};
pbjs.que = pbjs.que || [];
pbjs.cmd = pbjs.cmd || [];

export const googletag: any = GLOBAL.googletag = GLOBAL.googletag || {};
googletag.cmd = googletag.cmd || [];

type Fn = () => void;

/**
 * Wrap fn and make sure it's called at most once.
 */
export const once = (fn: Fn): Fn => {
  let called = false;
  return () => {
    if (!called) {
      called = true;
      fn();
    }
  };
};

export const allEvents: SortableAds.EventKey[] = [
 'eventListenerError',
 'error',
 'warning',
 'updateSetting',
 'defineAds',
 'requestAds',
 'destroyAds',
 'loadNewPage',
 'usePlugin',
 'start',
 'noUnitDefined',
 'requestUndefinedAdWarning',
];
