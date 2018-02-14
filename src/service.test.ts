import { assert } from 'chai';
import EventEmitter from './event-emitter';
import Service from './service';

describe('Service', () => {

  it('should emit "noUnitDefined" event when defineUnit service return null or undefined', async () => {
    const emitter = new EventEmitter();
    let calls = 0;
    const ids = ['123', '456'];
    const adConfigs = ids.map(elementId => ({ elementId }));

    emitter.addEventListener('noUnitDefined', event => {
      assert.include(adConfigs, event.adConfig);
      calls++;
    });

    const plugin: SortableAds.AdServerPlugin<string> = {
      type: 'adServer',
      name: 'GPT',
      initAsync: cb => cb(),
      defineUnit: adUnit => null,
      requestAdServer: units => undefined,
    };
    const service = new Service(emitter, plugin);

    service.getOrDefineUnits(adConfigs);

    assert.equal(calls, 2);
  });

  it('should emit error event when plugin.requestBids has an exception', async () => {
    const emitter = new EventEmitter();
    let calls = 0;
    const error = new Error('requestHB failed');
    const adConfigs = [{
      elementId: '123',
    }, {
      elementId: '456',
    }];

    emitter.addEventListener('error', event => {
      calls++;
    });

    const plugin: SortableAds.HeaderBiddingPlugin<string> = {
      type: 'headerBidding',
      name: 'HB config',
      initAsync: cb => cb(),
      defineUnit: adUnit => adUnit.elementId,
      requestBids: (units, timeout, done) => {
        throw error;
      },
      beforeRequestAdServer: units => {/** noop */},
    };
    const service = new Service(emitter, plugin);

    service.requestBids(service.getOrDefineUnits(adConfigs), 10, () => {/** noop */});

    assert.equal(calls, 1);
  });

  it('should emit error event when plugin.requestAdServer has an exception', async () => {
    const emitter = new EventEmitter();
    let calls = 0;
    const error = new Error('requestGPT failed');
    const adConfigs = [{
      elementId: '123',
    }, {
      elementId: '456',
    }];

    emitter.addEventListener('error', event => {
      calls++;
    });

    const plugin: SortableAds.AdServerPlugin<string> = {
      type: 'adServer',
      name: 'GPT',
      initAsync: cb => cb(),
      defineUnit: adUnit => adUnit.elementId,
      requestAdServer: units => {
        throw error;
      },
    };
    const service = new Service(emitter, plugin);

    service.requestAdServer(service.getOrDefineUnits(adConfigs));

    assert.equal(calls, 1);
  });

});
