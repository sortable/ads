
# Plugin System

---

## Introduction

Plugins are what Ads Manager uses to communicate with header bidders and ad servers. All interaction with the external services that Ads Manager connects to should be encapsulated within a Plugin. There are 2 types of plugins: one for header bidding, and one for ad servers. These plugins expose slightly different interfaces.

?> You need to load **one** ad server plugin to make ads manager work. You could have **zero** or **more** header bidding plugins to support header bidding. If no header bidding plugin is enabled, there is no delay from header bidding during requesting.

## Built-in Plugins

Ads Manager comes with a few ready to use plugins:

* [GPT plugin](use-gpt-plugin.md): an ad server plugin to connect Ads Manager with GPT services.
* [Prebid plugin](use-prebid-plugin.md): a header bidding plugin to connect Ads Manager with [Prebid.js](http://prebid.org) solution.
* [Sortable plugin](use-sortable-plugin.md): a header bidding plugin to connect Ads Manager with [sortable.com](https://sortable.com)'s services.

## Key Concepts

### Use Element ID to Identify Ad

First, we define ads by element ID via `sortableads.defineAds([{ elementId }])`. Then, we request ads by element ID via `sortableads.requestAds([elementId])` (or `<Ad id={elementId}/>` for React). It will find matching ad definition and send request for header bidder and ad server. Doing so, we can decouple the configuration and runtime requesting, which would result clear code and flexible architecture. For example, vanilla JavaScript API and the React API will share the configuration part but have different runtime requesting API usage.

### Use One Unified Object for All Plugins

We use one unified object to ad properties for all plugins. The Object only has two general properties:

* `elementId` (required) - The unique string ID for a DOM element on a page where the ad should go.

* `sizes` (optional) - The default sizes of the ad. Only accept following formats:
  * `[300, 250]`
  * `[[300, 250], [300,600]]`

```js
const unifiedObject = {
  elementId: 'div-id-1', // required
  sizes: [300, 250],     // optional, default sizes for plugins
  GPT: {
    // GPT's properties
  },
  prebid: {
    // prebid's properties
  },
  sortable: {
    // sortable's properties
  },
  custom: {
    // custom's properties
  }
};

sortableads.defineAds([unifiedObject]);
```

When we request ads by element ID, plugin will be able to read the matching `unifiedObject` and send request based on its properties.
