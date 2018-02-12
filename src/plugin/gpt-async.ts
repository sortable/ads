import { googletag, once } from '../util';

export default (option?: SortableAds.GPTPluginOption): SortableAds.AdServerPlugin<any> => {
  if (option == null) {
    option = {};
  }

  const disableInitialLoad = option.disableInitialLoad !== false;
  const enableSingleRequest = option.enableSingleRequest !== false;

  const assertDisableInitialLoadAsExpected = once(() => {
    if (typeof window !== 'undefined' &&
        // @ts-ignore: window.googletag
        window.googletag &&
        // @ts-ignore: window.googletag
        window.googletag.pubadsReady &&
        // @ts-ignore: window.google_DisableInitialLoad
        window.google_DisableInitialLoad != null &&
        // @ts-ignore: window.google_DisableInitialLoad
        window.google_DisableInitialLoad !== disableInitialLoad) {
      throw new Error('Detect that `disableInitialLoad` does not work as expected');
    }
  });

  const displayedElementIds: { [index: string]: true | undefined } = {};

  return {
    type: 'adServer',

    name: 'GPT',

    initAsync: cb => {
      googletag.cmd.push(() => {
        if (disableInitialLoad) {
          googletag.pubads().disableInitialLoad();
        }
        if (enableSingleRequest) {
          googletag.pubads().enableSingleRequest();
        }
        googletag.enableServices();
        cb();
      });
    },

    defineUnit: adConfig => {
      const GPT = adConfig.GPT;
      if (!GPT) {
        return;
      }

      const sizes = GPT.sizes || adConfig.sizes;
      if (!sizes) {
        throw new Error('Cannot find size');
      }

      const slot = googletag.defineSlot(GPT.adUnitPath, sizes, adConfig.elementId);
      if (!slot) {
        throw new Error('Cannot define slot');
      }

      slot.addService(googletag.pubads());

      const sizeMapping = GPT.sizeMapping;
      if (sizeMapping) {
        const mapping = googletag.sizeMapping();
        sizeMapping.forEach(s => mapping.addSize(s.viewport, s.sizes));
        slot.defineSizeMapping(mapping.build());
      }

      const targeting = GPT.targeting;
      if (targeting) {
        for (const key of Object.keys(targeting)) {
          slot.setTargeting(targeting[key]);
        }
      }

      const attributes = GPT.attributes;
      if (attributes) {
        for (const key of Object.keys(attributes)) {
          slot.set(key, attributes[key]);
        }
      }

      const categoryExclusion = GPT.categoryExclusion;
      if (categoryExclusion) {
        slot.setCategoryExclusion(categoryExclusion);
      }

      const clickUrl = GPT.clickUrl;
      if (clickUrl) {
        slot.setClickUrl(clickUrl);
      }

      const collapseEmptyDiv = GPT.collapseEmptyDiv;
      const collapseBeforeAdFetch = GPT.collapseBeforeAdFetch;
      if (collapseEmptyDiv != null) {
        slot.collapseEmptyDiv(collapseEmptyDiv);
      }

      const forceSafeFrame = GPT.forceSafeFrame;
      if (forceSafeFrame != null) {
        slot.setForceSafeFrame(forceSafeFrame);
      }

      const safeFrameConfig = GPT.safeFrameConfig;
      if (safeFrameConfig) {
        slot.setSafeFrameConfig(safeFrameConfig);
      }

      return slot;
    },

    requestAdServer: slots => {
      const refreshSlots = [];

      for (const slot of slots) {
        const elementId = slot.getSlotElementId();
        if (displayedElementIds[elementId]) {
          // Slot has been displayed before, therefore it's a refresh request.
          refreshSlots.push(slot);
        } else {
          googletag.display(elementId);
          displayedElementIds[elementId] = true;
          if (disableInitialLoad) {
            // When disableInitialLoad is called, we need call refresh to request ad properly
            refreshSlots.push(slot);
          }
        }
      }

      if (refreshSlots.length > 0) {
        googletag.pubads().refresh(refreshSlots, { changeCorrelator: false });
      }

      // Assert at the end of function, so it won't interrupt ads serving.
      // It should trigger error message if assertion failed.
      assertDisableInitialLoadAsExpected();
    },

    destroyUnits(slots) {
      for (const slot of slots) {
        delete displayedElementIds[slot.getSlotElementId()];
      }
      googletag.destroySlots(slots);
    },

    loadNewPage() {
      googletag.pubads().updateCorrelator();
    },
  };
};
