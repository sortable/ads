import { assert } from 'chai';
import Manager from './manager';

describe('test Manager class', () => {

  it('should have default bidder timeout as 1500ms', async () => {
    const manager = new Manager();
    assert.equal(manager.getBidderTimeout(), 1500);
  });

});
