# Use GPT Plugin

---

?> **GPT** stands for [Google Publisher Tag](https://developers.google.com/doubleclick-gpt/reference).

## Installation & Initialization

> * Add GPT script link to HTML page.
> * Initialize `googletag` global variable.

```html
<html>
  <head>
    <script async src="https://www.googletagservices.com/tag/js/gpt.js"></script>
    <script>
      var googletag = googletag || {};
      googletag.cmd = googletag.cmd || [];
    </script>
  </head>
</html>
```

## Load Plugin in Configuration

> * Step 1: add page level configuration
> * Step 2: load GPT plugin via `sortableads.useGPTAsync`
> * Step 3: update defined ads with GPT properties

!> **Note**: Under the hood, `sortableads.useGPTAsync` will push commands to GPT's command queue, calling GPT methods such as [disableInitialLoad], [enableSingleRequest] and [enableServices]. The user should not call these GPT methods directly. This is by design to make GPT work with header bidding.

```js
sortableads.push(function() {
  // Step 1: add page level configuration
  googletag.cmd.push(function() {
    googletag.pubads().setTargeting('page', 'home');
  });

  // Step 2: load GPT plugin
  sortableads.useGPTAsync({
    // It's `true` by default. Set `false` to disable it.
    disableInitialLoad: true,

    // It's `true` by default. Set `false` to disable it.
    enableSingleRequest: true
  });

  sortableads.defineAds([{
    elementId: 'div-id-1',
    // Step 3: update defined ads with GPT properties
    GPT: {
      adUnitPath: '/1234/abcd',
      sizes: [[300, 250], 'fluid']
    }
  }]);
});
```

## Full Example

[](//jsfiddle.net/vqv8r7np/178/embedded/html,result/?sortableads_debug=true ':include :type=iframe width=100% height=700 allowpaymentrequest allowfullscreen frameborder=0')

[disableInitialLoad]: https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_disableInitialLoad
[enableSingleRequest]: https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_enableSingleRequest
[enableServices]: https://developers.google.com/doubleclick-gpt/reference#googletag.enableServices

## GPT Properties Example

These properties are based on [googletag.Slot](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot).


```javascript
sortableads.defineAds([{
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
}]);
```

## GPT Properties Reference

### `adUnitPath`
* **Scope**: required
* **Type**: string
* **Description**: The ad unit path to use to define the slot.
* **DFP Method**: [`googletag.Slot.defineSlot`](https://developers.google.com/doubleclick-gpt/reference#googletag.defineSlot)

### `sizes`
* **Scope**: optional
* **Type**: [`googletag.GeneralSize`](https://developers.google.com/doubleclick-gpt/reference#googletag.GeneralSize)
* **Description**: The width and height for a specific slot.
* **Note**: This will override AdConfig.sizes. GPT will default to AdConfig.sizes if this is missing.
* **DFP Method**: [`googletag.Slot.defineSlot`](https://developers.google.com/doubleclick-gpt/reference#googletag.defineSlot)

### `sizeMapping`
* **Scope**: optional
* **Type**: Array of `{ viewport, sizes }` object
* **Description**: Mapping between viewport size and ad sizes.
* **DFP Method**: [`googletag.Slot.defineSizeMapping`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_defineSizeMapping)

### `targeting`
* **Scope**: optional
* **Type**: Object
* **Description**: Custom targeting key-value pairs to set for a specific slot.
* **DFP Method**: [`googletag.Slot.setTargeting`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setTargeting)

### `attributes`
* **Scope**: optional
* **Type**: Object
* **Description**: AdSense attribute key-value pairs that apply to all slots.
* **DFP Method**: [`googletag.Slot.set`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_set)

### `categoryExclusion`
* **Scope**: optional
* **Type**: string
* **Description**: Category to exclude for a specific slot.
* **DFP Method**: [`googletag.Slot.setCategoryExclusion`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setCategoryExclusion)

### `clickUrl`
* **Scope**: optional
* **Type**: string
* **Description**: The url to open when the ad is clicked.
* **DFP Method**: [`googletag.Slot.setClickUrl`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setClickUrl)

### `collapseEmptyDiv`
* **Scope**: optional
* **Type**: boolean
* **Description**: Flag to enable collapsing empty divs.
* **DFP Method**: [`googletag.Slot.setCollapseEmptyDiv`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setCollapseEmptyDiv)

### `collapseBeforeAdFetch`
* **Scope**: optional
* **Type**: boolean
* **Description**: Option to collapse empty divs before fetching ads. Used with collapseEmptyDiv.
* **DFP Method**: [`googletag.Slot.setCollapseEmptyDiv`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setCollapseEmptyDiv)

### `forceSafeFrame`
* **Scope**: optional
* **Type**: boolean
* **Description**: Flag to set all ad slots to render with safe frames.
* **DFP Method**: [`googletag.Slot.setForceSafeFrame`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setForceSafeFrame)

### `safeFrameConfig`
* **Scope**: optional
* **Type**: [googletag.SafeFrameConfig](https://developers.google.com/doubleclick-gpt/reference#googletag.SafeFrameConfig)
* **Description**: Set page level preferences for SafeFrame configuration.
* **DFP Method**: [`googletag.Slot.setForceSafeFrame`](https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_setForceSafeFrame)
