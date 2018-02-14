import debug from './debug';
import Manager from './manager';
import GPTAsync from './plugin/gpt-async';
import prebidForGPTAsync from './plugin/prebid-for-gpt-async';
import sortableForGPTAsync from './plugin/sortable-for-gpt-async';
import { sortableads } from './util';

if (!sortableads.apiReady) {
  const manager = new Manager();

  sortableads.get = x => manager.get(x);
  sortableads.set = (x, y) => manager.set(x, y);
  sortableads.defineAds = x => manager.defineAds(x);
  sortableads.requestAds = x => manager.requestAds(x);
  sortableads.getRequestedElementIds = () => manager.getRequestedElementIds();
  sortableads.destroyAds = x => manager.destroyAds(x);
  sortableads.loadNewPage = () => manager.loadNewPage();
  sortableads.use = x => manager.use(x);
  sortableads.useGPTAsync = x => manager.use(GPTAsync(x));
  sortableads.usePrebidForGPTAsync = () => manager.use(prebidForGPTAsync());
  sortableads.useSortableForGPTAsync = () => manager.use(sortableForGPTAsync());
  sortableads.start = () => manager.start();
  sortableads.addEventListener = (x, y) => manager.addEventListener(x, y);
  sortableads.removeEventListener = (x, y) => manager.removeEventListener(x, y);

  sortableads.apiReady = true;
  sortableads.version = '0.0.5';

  manager.tryCatch('debug', debug);

  // execute all queued operations
  const execute = (fn: () => void) => manager.tryCatch('push', fn);
  sortableads.push = fn => {
    execute(fn);
    return sortableads.length;
  };
  sortableads.forEach(execute);
  sortableads.splice(0, sortableads.length);
}
