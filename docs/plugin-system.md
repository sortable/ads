
## Plugin Usage

Plugins are what Ads Manager uses to communicate with header bidders and ad servers. Ads Manager comes with a ready to use GPT Async plugin for an ad server integration, and a Prebid plugin for a header bidder integration.

TODO: may add a diagram ?

### Plugin Documentation

All interaction with the external services that Ads Manager connects to should be encapsulated within a Plugin. There are 2 types of plugins: one for header bidding, and one for ad servers. These plugins expose slightly different interfaces.


### Plugin Configuration

The `AdConfig` is a configuration object for one ad unit, which is associated with an element on the page by its ID. The object contains an interface for each built-in header bidder and ad server plugin provided. When you write your own plugin for another service, you can add the ad unit properties you require for that service as part of its interface in the AdConfig.

The AdConfig only has two general properties:

`elementId` (required) - The unique string ID for a DOM element on a page where the ad should go.

```javascript
elementId: 'nameOfDiv'
```

`sizes` (optional) - The acceptable sizes of the ad to be returned.

```javascript
sizes: [[300, 250], [300, 600]]
```

The other parameters you can set in the AdConfig are passed to specific plugins. For example, to configure the provided async GPT plugin, you would put all the parameters it needs in the GPT object. All the interfaces are **optional**, as you can choose which header bidding services you would like to send requests to on a per ad-unit basis.

### GPT Plugin Configuration

The interface for the provided async GPT plugin. Most parameters listed are arguments passed to methods in GPT under [googletag.Slot](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot). To minimize duplication, refer to GPT documentation for more detail on GPT specific API calls. Additional comments refer to special behaviour for Ads Manager.

**Full Example with all properties:**

```javascript
adconfig = {
  elementId: 'div-id-1',
  sizes: [[300, 250], [300, 600]],
  GPT: {
    /* required */
    adUnitPath: '/1234/slotName',

    /* following are optional */
    sizes: [728, 90],
    sizeMapping: [
      { viewport: [1024, 768], sizes: [970, 250] },
      { viewport: [980, 690],  sizes: [728, 90] },
      { viewport: [640, 480],  sizes: 'fluid' },
      { viewport: [0, 0], sizes: [88, 31] }
    ],
    targeting: {
      dog: 'dawg',
      bird: 'burd'
    },
    attributes: {
      cat: 'kat',
      mouse: 'mawse'
    },
    categoryExclusion: 'badCategory',
    clickUrl: 'www.somememesite.com',
    collapseEmptyDiv: true,
    collapseBeforeAdFetch: false,
    forceSafeFrame: true,
    safeFrameConfig: {
      allowOverlayExpansion: false,
      allowPushExpansion: true,
      sandbox: false
    }
  },
  ...
};
```

**GPT Properties**

`adUnitPath`
* **Scope**: required
* **Type**: string
* **Description**: The ad unit path to use to define the slot.
* **DFP Method**: [`googletag.Slot.defineSlot`](https://developers.google.com/doubleclick-gpt/reference#googletag.defineSlot)

---

`sizes`
* **Scope**: optional
* **Type**: [`googletag.GeneralSize`](https://developers.google.com/doubleclick-gpt/reference#googletag.GeneralSize)
* **Description**: The width and height for a specific slot.
* **Note**: This will override AdConfig.sizes. GPT will default to AdConfig.sizes if this is missing.
* **DFP Method**: [`googletag.Slot.defineSlot`](https://developers.google.com/doubleclick-gpt/reference#googletag.defineSlot)

---

`sizeMapping`
* **Scope**: optional
* **Type**: Array of [`googletag.SizeMapping`](https://developers.google.com/doubleclick-gpt/reference#googletag.SizeMapping)
* **Description**: Mapping between viewport size and ad sizes.
* **DFP Method**: [`googletag.Slot.defineSizeMapping`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_defineSizeMapping)

---

`targeting`
* **Scope**: optional
* **Type**: Object
* **Description**: Custom targeting key-value pairs to set for a specific slot.
* **DFP Method**: [`googletag.Slot.setTargeting`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setTargeting)

---

`attributes`
* **Scope**: optional
* **Type**: Object
* **Description**: AdSense attribute key-value pairs that apply to all slots.
* **DFP Method**: [`googletag.Slot.set`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_set)

---

`categoryExclusion`
* **Scope**: optional
* **Type**: string
* **Description**: Category to exclude for a specific slot.
* **DFP Method**: [`googletag.Slot.setCategoryExclusion`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setCategoryExclusion)

---

`clickUrl`
* **Scope**: optional
* **Type**: string
* **Description**: The url to open when the ad is clicked.
* **DFP Method**: [`googletag.Slot.setClickUrl`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setClickUrl)

---

`collapseEmptyDiv`
* **Scope**: optional
* **Type**: boolean
* **Description**: Flag to enable collapsing empty divs.
* **DFP Method**: [`googletag.Slot.setCollapseEmptyDiv`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setCollapseEmptyDiv)

---

`collapseBeforeAdFetch`
* **Scope**: optional
* **Type**: boolean
* **Description**: Option to collapse empty divs before fetching ads. Used with collapseEmptyDiv.
* **DFP Method**: [`googletag.Slot.setCollapseEmptyDiv`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setCollapseEmptyDiv)

---

`forceSafeFrame`
* **Scope**: optional
* **Type**: boolean
* **Description**: Flag to set all ad slots to render with safe frames.
* **DFP Method**: [`googletag.Slot.setForceSafeFrame`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setForceSafeFrame)

---

`safeFrameConfig`
* **Scope**: optional
* **Type**: [googletag.SafeFrameConfig](https://developers.google.com/doubleclick-gpt/reference#googletag.SafeFrameConfig)
* **Description**: Set page level preferences for SafeFrame configuration.
* **DFP Method**: [`googletag.Slot.setForceSafeFrame`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setForceSafeFrame)

---

### Prebid Plugin Configuration

The interface for the provided GPT-compatible Prebid plugin. See the [Prebid Adunit Reference](http://prebid.org/dev-docs/adunit-reference.html) for more information about the following parameters.

**Full Example with all properties:**

```javascript
adconfig = {
  elementId: 'some-id',
  sizes: [[300, 250], [300, 600]],
  prebid: {
    // NOTE: code is not needed, it will be replaced with elementId by Ads Manager
    bids: [{
      bidder: 'appnexus',
      params: { placementId: '1234' },
      labelAny: ['phone', 'desktop'],
      labelAll: ['tablet', 'eur']
    }],
    mediaTypes: ['video', 'banner'],
    labelAny: ['food', 'travel'],
    labelAll: ['recreation', 'entertainment']
  }
};
```

`sizes`
* **Scope**: optional
* **Type**: Array[Number] or Array[Array[Number]]
* **Description**: The width and height for a specific slot.
* **Note**: This will override AdConfig.sizes. Prebid will default to AdConfig.sizes if this is missing.

---

`bids`
* **Scope**: required
* **Type**: Array[Object]
* **Description**: Bid objects for a given ad unit.
* **Prebid Reference**: [`adUnit.bids`](http://prebid.org/dev-docs/adunit-reference.html#adunitbids)

---

`mediaTypes`
* **Scope**: optional
* **Type**: Object
* **Description**: Allowed media types for the ad.
* **Prebid Reference**: [`adUnit.mediaTypes`](http://prebid.org/dev-docs/adunit-reference.html#adunitmediatypes)

---

`labelAny`
* **Scope**: optional
* **Type**: Array[string]
* **Description**: Labels for conditional ad units. The condition passes if any label matches.
* **Prebid Reference**: [`adUnit`](http://prebid.org/dev-docs/adunit-reference.html#adunit)

---

`labelAll`
* **Scope**: optional
* **Type**: Array[string]
* **Description**: Labels for conditional ad units. The condition passes if all labels match.
* **Prebid Reference**: [`adUnit`](http://prebid.org/dev-docs/adunit-reference.html#adunit)
