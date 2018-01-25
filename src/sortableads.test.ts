import { assert } from 'chai';
import './sortableads';

describe('test sortableads API', () => {

  it('should include all API', async () => {
    assert.equal(typeof sortableads.getVersion, 'function');
    assert.equal(typeof sortableads.getDebug, 'function');
    assert.equal(typeof sortableads.setDebug, 'function');
    assert.equal(typeof sortableads.getBidderTimeout, 'function');
    assert.equal(typeof sortableads.setBidderTimeout, 'function');
    assert.equal(typeof sortableads.getAdElementIds, 'function');
    assert.equal(typeof sortableads.requestAds, 'function');
    assert.equal(typeof sortableads.destroyAds, 'function');
    assert.equal(typeof sortableads.loadNewPage, 'function');
    assert.equal(typeof sortableads.registerGPT, 'function');
    assert.equal(typeof sortableads.registerHB, 'function');
    assert.equal(typeof sortableads.addEventListener, 'function');
    assert.equal(typeof sortableads.removeEventListener, 'function');
    assert.equal(typeof sortableads.apiReady, 'boolean');
    assert.equal(typeof sortableads.push, 'function');
  });

  it('should have apiReady now', async () => {
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
