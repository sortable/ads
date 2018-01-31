import { assert } from 'chai';
import Manager from './manager';

/* tslint:disable:max-classes-per-file */

class TestGPTConfig {
  public config: SortableAds.GPTConfig<string>;
  public initialized: boolean = false;
  public defined: boolean = false;
  public requested: boolean = false;
  public destroyed: boolean = false;
  public loadedPage: boolean = false;

  constructor(opts: { [key: string]: any; } = {}) {
    this.config = {
      defineUnit: (divId: string) => {
        this.defined = true;
        return divId;
      },
      destroyUnits: (units: string[]) => {
        this.destroyed = true;
      },
      init: (cb: SortableAds.CallbackFunction) => {
        this.initialized = true;
        cb();
      },
      loadNewPage: () => {
        this.loadedPage = true;
      },
      requestGPT: (context: SortableAds.GPTContext<string>) => {
        this.requested = true;
      },
    };
  }
}

class TestHBConfig {
  public config: SortableAds.HBConfig<string>;
  public initialized: boolean = false;
  public defined: boolean = false;
  public requested: boolean = false;
  public destroyed: boolean = false;
  public loadedPage: boolean = false;

  constructor(opts: { [key: string]: any; } = {}) {
    this.config = {
      defineUnit: (divId: string) => {
        this.defined = true;
        return divId;
      },
      destroyUnits: (units: string[]) => {
        this.destroyed = true;
      },
      init: (cb: SortableAds.CallbackFunction) => {
        this.initialized = true;
        if (opts.omitCb) {
          return;
        } else if (opts.delayCb > 0) {
          setTimeout(() => {
            cb();
          }, opts.delayCb);
        } else {
          cb();
        }
      },
      loadNewPage: () => {
        this.loadedPage = true;
      },
      name: 'hb config',
      requestHB: (context: SortableAds.HBContext<string>) => {
        context.done();
        this.requested = true;
      },
    };
  }
}

const sleep = (t: number) => new Promise(resolve => setTimeout(resolve, t));

const THROTTLE_MS = 50;

describe('Manager', () => {

  it('should have default bidder timeout as 1500ms', async () => {
    const manager = new Manager();
    assert.equal(manager.getBidderTimeout(), 1500);
  });

  describe('getRequestedElementIds', () => {
    it('should be empty if requestAds has not been run', async () => {
      const manager = new Manager();
      assert.equal(manager.getRequestedElementIds().length, 0);
    });
  });

  describe('requestAds', () => {
    it('should do nothing if passed empty array', async () => {
      const manager = new Manager();
      manager.requestAds([]);
      const ads = manager.getRequestedElementIds();
      assert.equal(ads.length, 0);
    });

    it('should add divs to requested list of ads when called multiple times', async () => {
      const manager = new Manager();
      manager.requestAds(['test1']);
      manager.requestAds(['test2']);
      const ads = manager.getRequestedElementIds();
      assert.equal(ads.length, 2);
      assert.sameMembers(ads, ['test1', 'test2']);
    });

    it('should add multiple divs to requested list of ads when called once', async () => {
      const manager = new Manager();
      manager.requestAds(['test1', 'test2']);
      const ads = manager.getRequestedElementIds();
      assert.equal(ads.length, 2);
      assert.sameMembers(ads, ['test1', 'test2']);
    });

    it('should not produce duplicate requested ads', async () => {
      const manager = new Manager();
      manager.requestAds(['test1', 'test1']);
      const ads = manager.getRequestedElementIds();
      assert.equal(ads.length, 1);
      assert.equal(ads[0], 'test1');
    });
  });

  describe('destroyAds', () => {
    it('should do nothing if passed empty array', async () => {
      const manager = new Manager();
      manager.requestAds(['test1', 'test2']);
      manager.destroyAds([]);
      assert.equal(manager.getRequestedElementIds().length, 2);
    });

    it('should remove divs from list of requested ads', async () => {
      const manager = new Manager();
      manager.requestAds(['test1', 'test2']);
      manager.destroyAds(['test1']);
      assert.equal(manager.getRequestedElementIds().length, 1);
    });
  });

  describe('registerGPT', () => {
    it('should enable requestAds to proceed with making requests', async () => {
      const manager = new Manager();
      const gpt = new TestGPTConfig();
      manager.registerGPT(gpt.config);

      manager.requestAds(['test1', 'test2']);
      assert.equal(manager.getRequestedElementIds().length, 2);
      assert.isTrue(gpt.initialized);
      assert.isFalse(gpt.defined);
      assert.isFalse(gpt.requested);

      await sleep(THROTTLE_MS);
      assert.isTrue(gpt.defined);
      assert.isTrue(gpt.requested);
    });

    it('should not define ad unit if the requested div was destroyed during throttling', async () => {
      const manager = new Manager();
      const gpt = new TestGPTConfig();
      manager.registerGPT(gpt.config);

      manager.requestAds(['test1']);
      assert.equal(manager.getRequestedElementIds().length, 1);
      assert.isTrue(gpt.initialized);
      assert.isFalse(gpt.defined);
      assert.isFalse(gpt.requested);

      manager.destroyAds(['test1']);
      assert.isTrue(gpt.destroyed);

      await sleep(THROTTLE_MS);
      assert.isFalse(gpt.defined);
      assert.isFalse(gpt.requested);
    });

    it('cannot be registered twice', async () => {
      const manager = new Manager();
      let warned = false;
      manager.addEventListener('warning', event => {
        warned = true;
      });
      const gpt1 = new TestGPTConfig();
      const gpt2 = new TestGPTConfig();

      manager.registerGPT(gpt1.config);
      assert.isTrue(gpt1.initialized);
      assert.isFalse(warned);

      manager.registerGPT(gpt2.config);
      assert.isFalse(gpt2.initialized);
      assert.isTrue(warned);
    });
  });

  describe('registerHB', () => {
    it('should not define and request ads if GPT is not instantiated', async () => {
      const manager = new Manager();
      const hb = new TestHBConfig();
      manager.registerHB(hb.config);

      manager.requestAds(['test1', 'test2']);
      await sleep(THROTTLE_MS);
      assert.isTrue(hb.initialized);
      assert.isFalse(hb.defined);
      assert.isFalse(hb.requested);
    });

    it('should define and request ads if GPT is instantiated', async () => {
      const manager = new Manager();
      const gpt = new TestGPTConfig();
      const hb = new TestHBConfig();
      manager.registerGPT(gpt.config);
      manager.registerHB(hb.config);

      manager.requestAds(['test1', 'test2']);
      await sleep(THROTTLE_MS);
      // HB should have finished making the request
      assert.isTrue(hb.initialized);
      assert.isTrue(hb.defined);
      assert.isTrue(hb.requested);

      // GPT should have been requested through bidsReady()
      assert.isTrue(gpt.initialized);
      assert.isTrue(gpt.defined);
      assert.isTrue(gpt.requested);
    });

    it('should not block GPT from requesting ads if HB is never initialized', async () => {
      const manager = new Manager();
      manager.setBidderTimeout(50);

      const gpt = new TestGPTConfig();
      const hb = new TestHBConfig({omitCb: true});

      manager.registerGPT(gpt.config);
      manager.registerHB(hb.config);

      manager.requestAds(['test1', 'test2']);

      await sleep(THROTTLE_MS);
      // HB does not call the callback, so will never be ready
      assert.isTrue(hb.initialized);
      assert.isFalse(hb.defined);
      assert.isFalse(hb.requested);

      assert.isTrue(gpt.initialized);
      assert.isFalse(gpt.defined);
      assert.isFalse(gpt.requested);

      await sleep(manager.getBidderTimeout() + 100);
      // after the bidder timeout expires, we will skip the HB
      // and continue with GPT
      assert.isTrue(gpt.defined);
      assert.isTrue(gpt.requested);
    });

    it('should not request from the HB if it took too long to initialize', async () => {
      const manager = new Manager();
      manager.setBidderTimeout(50);

      const delay = manager.getBidderTimeout() + 100;
      const gpt = new TestGPTConfig();
      const hb = new TestHBConfig({delayCb: delay});

      manager.registerGPT(gpt.config);
      manager.registerHB(hb.config);

      manager.requestAds(['test1', 'test2']);

      await sleep(THROTTLE_MS + delay);
      // HB bidReady callback should be aborted
      assert.isTrue(hb.initialized);
      assert.isFalse(hb.defined);
      assert.isFalse(hb.requested);

      // GPT should be requested
      assert.isTrue(gpt.initialized);
      assert.isTrue(gpt.defined);
      assert.isTrue(gpt.requested);
    });
  });

});
