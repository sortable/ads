import { assert } from 'chai';
import Service from './service';
import EventEmitter from './event-emitter';

describe('Service', () => {

  it('should emit "noUnitDefined" event when defineUnit service return null or undefined', async () => {
    const emitter = new EventEmitter();
    let calls = 0;

    emitter.addEventListener('noUnitDefined', event => {
      assert.include(ids, event.elementId);
      calls++;
    });

    const config: SortableAds.GPTServiceConfig<string> = {
      name: 'GPT config',
      type: 'GPT',
      init: cb => {
        cb();
      },
      requestGPT: context => {},
      defineUnit: divId => {
        return null;
      }
    };
    const service = new Service(emitter, config);
    const ids = ['123', '456'];

    service.define(ids);

    assert.equal(calls, 2);
  });

  it('should emit error event when config.requestHB has an exception', async () => {
    const emitter = new EventEmitter();
    let calls = 0;
    const error = new Error("requestHB failed;")

    emitter.addEventListener('error', event => {
      calls++;
    });
    
    const config: SortableAds.HBServiceConfig<string> = {
      name: 'HB config',
      type: 'HB',
      init: cb => {
        cb();
      },
      requestHB: context => {
        throw error;
      },
      defineUnit: divId => {
        return divId;
      }
    };
    const service = new Service(emitter, config);
    const ids = ['123', '456'];

    const context: any = service.define(ids);
    context.beforeRequestGPT = null;
    service.requestHB(context);

    assert.equal(calls, 1);
  });

  it('should emit error event when config.requestGPT has an exception', async () => {
    const emitter = new EventEmitter();
    let calls = 0;
    const error = new Error("requestGPT failed;")

    emitter.addEventListener('error', event => {
      calls++;
    });
    
    const config: SortableAds.GPTServiceConfig<string> = {
      name: 'GPT config',
      type: 'GPT',
      init: cb => {
        cb();
      },
      requestGPT: context => {
        throw error;
      },
      defineUnit: divId => {
        return divId;
      }
    };
    const service = new Service(emitter, config);
    const ids = ['123', '456'];

    const context = service.define(ids);
    service.requestGPT(context);

    assert.equal(calls, 1);
  });

  it('should refresh ads properly', async () => {
    // requestAds for id1
    // after sometime, like 2 or 3 seconds
    // requestAds for id1
    // => this time should be categorised as refresh ad instead of new one (in context)
    const emitter = new EventEmitter();
    const config: SortableAds.GPTServiceConfig<string> = {
      name: 'GPT config',
      type: 'GPT',
      init: cb => {
        cb();
      },
      requestGPT: context => {},
      defineUnit: divId => {
        return divId;
      }
    };
    const service = new Service(emitter, config);
    const ids = ['123', '456'];

    const context1 = service.define(ids);
    assert.includeMembers(context1.newIds, ids);
    assert.isEmpty(context1.refreshIds);

    const context2 = service.define(ids);
    assert.includeMembers(context2.refreshIds, ids);
    assert.isEmpty(context2.newIds);
  });

  it('should destroy ads properly', async () => {
    // requestAds for id1
    // after sometime, like 2 or 3 seconds
    // destroyAds for id1
    // requestAds for id1
    // => this time should be categorised as new ad instead of refreh one (in context)
    const emitter = new EventEmitter();
    const config: SortableAds.GPTServiceConfig<string> = {
      name: 'GPT config',
      type: 'GPT',
      init: cb => {
        cb();
      },
      requestGPT: context => {},
      defineUnit: divId => {
        return divId;
      }
    };
    const service = new Service(emitter, config);
    const ids = ['123', '456'];

    const context1 = service.define(ids);
    assert.includeMembers(context1.newIds, ids);
    assert.isEmpty(context1.refreshIds);

    service.destroy(ids);

    const context2 = service.define(ids);
    assert.includeMembers(context2.newIds, ids);
    assert.isEmpty(context2.refreshIds);
  });

});
