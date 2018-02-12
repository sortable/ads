import { allEvents, sortableads } from './util';

const PREFIX = 'SORTABLEADS';

const STORAGE_KEY = 'sortableads_debug';

/**
 * Query with "?sortableads_debug=true" will set debug to be true for current page.
 * Query with "?sortableads_debug=false" will set debug to be false for current page.
 * Query with "?sortableads_debug=true_storage" will set debug to be true and save it to localStorage.
 * Query with "?sortableads_debug=false_storage" will set debug to be false and save it to localStorage.
 * Query without "?sortabelads_debug" will check localStorage to take previous setting.
 * Otherwise, by default, debug is false.
 */
export default () => {
  if (typeof window === 'undefined') {
    return;
  }

  const search = window.top.location.search;
  const parsed = /[?&]sortableads_debug=(true|false)(_storage)?/.exec(search);

  if (parsed) {
    const debug = parsed[1]; // 'true' or 'false'
    const storage = parsed[2]; // '_storage' or undefined
    if (storage === '_storage') {
      try {
        window.localStorage.setItem(STORAGE_KEY, debug);
      } catch (_) { /* noop */ }
    }
    if (debug !== 'true') {
      return;
    }
  } else {
    // No config on URL, we need to check localStorage
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== 'true') {
        return;
      }
    } catch (_) {
      return;
    }
  }

  allEvents.forEach(name => {
    sortableads.addEventListener(name, (event: any) => {
      if (typeof console !== 'undefined') {
        if (name.match(/error/i) && console.error) {
          console.error(PREFIX, name, event);
        } else if (name.match(/warning/i) && console.warn) {
          console.warn(PREFIX, name, event);
        } else if (console.log) {
          console.log(PREFIX, name, event);
        }
      }
    });
  });
};
