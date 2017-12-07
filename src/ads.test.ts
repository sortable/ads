import { assert } from 'chai';
import * as adsManager from './ads';

describe('test manager code', () => {

  beforeEach(() => {
    adsManager.reset();
  });

  it('should have default bidder timeout as 1500ms', async () => {
    assert.equal(adsManager.getBidderTimeout(), 1500);
  });

  it('should have default throttle timeout as 50ms', async () => {
    assert.equal(adsManager.getThrottleTimeout(), 50);
  });

});
