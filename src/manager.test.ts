import { assert } from 'chai';
import Manager from './manager';

describe('test Manager class', () => {

  it('should have default bidder timeout as 1500ms', async () => {
    const manager = new Manager();
    assert.equal(manager.getBidderTimeout(), 1500);
  });

  it('should refresh ads properly', async () => {
    // requestAds for id1
    // after sometime, like 2 or 3 seconds
    // requestAds for id1
    // => this time should be categorised as refresh ad instead of new one (in context)
  });

  it('should destroy ads properly', async () => {
    // requestAds for id1
    // after sometime, like 2 or 3 seconds
    // destroyAds for id1
    // requestAds for id1
    // => this time should be categorised as new ad instead of refreh one (in context)
  });

});
