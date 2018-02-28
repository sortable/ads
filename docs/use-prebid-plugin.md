# Use Prebid Plugin

---

?> [Prebid](http://prebid.org) is an open source header bidding solution.

## Installation & Initialization

> * Add Prebid script to HTML page. You can download it from [prebid.org](http://prebid.org/download.html).
> * Initialize `pbjs` global variable.

```html
<html>
  <head>
    <!-- Following link should not been used in production. -->
    <script async src="https://acdn.adnxs.com/prebid/not-for-prod/prebid.js"></script>
    <script>
      var pbjs = pbjs || {};
      pbjs.que = pbjs.que || [];
    </script>
  </head>
</html>
```

## Load Plugin in Configuration

> * Step 0: setup GPT plugin
> * Step 1: add custom setting ( [Prebid API reference](http://prebid.org/dev-docs/publisher-api-reference.html) )
> * Step 2: load Prebid plugin via `sortableads.usePrebidForGPTAsync`
> * Step 3: update defined ads with prebid properties

```js
sortableads.push(function() {
  sortableads.useGPTAsync();

  // Step 1: add custom setting
  pbjs.que.push(function() {
    pbjs.setConfig({ priceGranularity: "medium" })
  });

  // Step 2: load Prebid plugin
  sortableads.usePrebidForGPTAsync();

  sortableads.defineAds([{
    elementId: 'test',
    sizes: [300, 250],
    GPT: {
      adUnitPath: '/19968336/header-bid-tag-0',
    },
    // Step 3: update defined ads with prebid properties
    prebid: {
      bids: [{
        bidder: 'appnexus',
        params: { placementId: '10433394' }
      }]
    }
  }]);

  sortableads.start();
});
```

## Full Example

[](//jsfiddle.net/vqv8r7np/176/embedded/html,result/ ':include :type=iframe width=100% height=700 allowpaymentrequest allowfullscreen frameborder=0')

## Prebid Properties

These properties are based on [Prebid Adunit Reference](http://prebid.org/dev-docs/adunit-reference.html).

```js
sortableads.push([{
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
}]);
```

## Prebid Properties Reference

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
