import { assert } from 'chai';
import EventEmitter from './event-emitter';

describe('EventEmitter', () => {

  it('should not fail emitting event when no listeners are registered', async () => {
    const emitter = new EventEmitter();
    const ids = ['123', '456'];

    try {
      emitter.emitEvent('requestAds', {
        elementIds: ['123', '456']
      });
    } catch (e) {
      assert.fail();
    }
  });

  it('should not fail on removing listeners that were not registered', async () => {
    const emitter = new EventEmitter();
    const ids = ['123', '456'];

    const listener = (event: {elementIds: string[]}) => {};

    try {
      emitter.removeEventListener('requestAds', listener);
    } catch (e) {
      assert.fail();
    }
  });

  it('should be able to listen on events', async () => {
    const emitter = new EventEmitter();
    const ids = ['123', '456'];
    let listened = false;

    emitter.addEventListener('requestAds', event => {
      assert.includeMembers(event.elementIds, ids);
      listened = true;
    });
    emitter.emitEvent('requestAds', {
      elementIds: ['123', '456']
    });
    assert.isTrue(listened);
  });

  it('should be able to remove listener', async () => {
    const emitter = new EventEmitter();
    const ids = ['123', '456'];
    let count = 0;
    
    const listener = (event: {elementIds: string[]}) => {
      count++;
    };

    emitter.addEventListener('requestAds', listener);
    emitter.emitEvent('requestAds', {
      elementIds: ['123', '456']
    });
    assert.equal(count, 1);

    emitter.removeEventListener('requestAds', listener);
    emitter.emitEvent('requestAds', {
      elementIds: ['123', '456']
    });
    assert.equal(count, 1);
  });

  it('should not impact other listeners if there is an exception within one listener', async () => {
    const emitter = new EventEmitter();
    const ids = ['123', '456'];
    let count = 0;
    
    const goodListener = (event: {elementIds: string[]}) => {
      count++;
    };

    const badListener = (event: {elementIds: string[]}) => {
      throw Error('I am so bad.');
    };

    emitter.addEventListener('requestAds', goodListener);
    emitter.addEventListener('requestAds', badListener);
    emitter.emitEvent('requestAds', {
      elementIds: ['123', '456']
    });
    assert.equal(count, 1);
  });

  it('should trigger "eventListenerError" event if there is an exception within listener', async () => {
    const emitter = new EventEmitter();
    const ids = ['123', '456'];
    let caught = false;

    const badListener = (event: {elementIds: string[]}) => {
      throw Error('I am so bad.');
    };

    const errorListener = (event: {error: any, listener: (event: any) => void, type: string}) => {
      caught = true;
      assert.equal(event.type, 'requestAds');
    };

    emitter.addEventListener('requestAds', badListener);
    emitter.addEventListener('eventListenerError', errorListener);
    
    emitter.emitEvent('requestAds', {
      elementIds: ['123', '456']
    });

    assert.isTrue(caught);
  });

  it('should not trigger another event if there is an exception within "eventListenerError" listener', async () => {
    const emitter = new EventEmitter();
    const ids = ['123', '456'];
    let count = 0;

    const badListener = (event: {elementIds: string[]}) => {
      throw Error('I am so bad.');
    };

    const errorListener = (event: {error: any, listener: (event: any) => void, type: string}) => {
      count++;
      throw Error('BRAAAAAAAM');
    };

    emitter.addEventListener('requestAds', badListener);
    emitter.addEventListener('eventListenerError', errorListener);
    
    emitter.emitEvent('requestAds', {
      elementIds: ['123', '456']
    });
    
    assert.equal(count, 1);
  });

});
