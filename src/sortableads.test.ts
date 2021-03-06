import { assert } from 'chai';
import './sortableads';

describe('sortableads', () => {

  it('should include all API methods', async () => {
    assert.equal(typeof sortableads.get, 'function');
    assert.equal(typeof sortableads.set, 'function');
    assert.equal(typeof sortableads.defineAds, 'function');
    assert.equal(typeof sortableads.requestAds, 'function');
    assert.equal(typeof sortableads.getRequestedElementIds, 'function');
    assert.equal(typeof sortableads.destroyAds, 'function');
    assert.equal(typeof sortableads.loadNewPage, 'function');
    assert.equal(typeof sortableads.use, 'function');
    assert.equal(typeof sortableads.useGPTAsync, 'function');
    assert.equal(typeof sortableads.usePrebidForGPTAsync, 'function');
    assert.equal(typeof sortableads.useSortableForGPTAsync, 'function');
    assert.equal(typeof sortableads.start, 'function');
    assert.equal(typeof sortableads.addEventListener, 'function');
    assert.equal(typeof sortableads.removeEventListener, 'function');
    assert.equal(typeof sortableads.apiReady, 'boolean');
    assert.equal(typeof sortableads.version, 'string');
    assert.equal(typeof sortableads.push, 'function');
  });

  it('should have correct version', async () => {
    // @ts-ignore: this should only be tested in node env
    if (typeof require !== 'undefined' && typeof __dirname !== 'undefined') {
      // @ts-ignore
      const version = JSON.parse(require('fs').readFileSync(__dirname + '/../package.json')).version;
      assert.equal(sortableads.version, version);
    }
  });

  it('should have apiReady set to true', async () => {
    assert.equal(sortableads.apiReady, true);
  });

  it('should override sortableads.push function', async () => {
    assert.notEqual(sortableads.push, Array.prototype.push);
  });

  it('should be able to execute command immediately now', async () => {
    let count = 0;

    sortableads.push(() => {
      count += 1;
    });
    assert.equal(count, 1);

    sortableads.push(() => {
      count += 1;
    });
    assert.equal(count, 2);
  });

});
