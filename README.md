
**WARNING: These libraries are under development and only availiable to select Sortable customers.**

## Sortable Ads

This repo contains libraries, examples and documentation for publishers integrating the Sortable ad framework into their sites.

## Table of Contents
* [Sortable Ads](#sortable-ads)
  * [Table of Contents](#table-of-contents)
  * [Ad Manager](#ad-manager)
     * [Build (For contributors)](#build-for-contributors)
     * [Usage (For consumers)](#usage-for-consumers)
  * [Example Integrations](#example-integrations)
  * [How to Debug](#how-to-debug)
  * [Plugin Usage](#plugin-usage)
     * [How to use GPT Async Plugin](#how-to-use-gpt-async-plugin)
     * [How to use Prebid for GPT Async Plugin](#how-to-use-prebid-for-gpt-async-plugin)
  * [Plugin Implementation](#plugin-implementation)
     * [How to write your own Header Bidding Plugin](#how-to-write-your-own-header-bidding-plugin)
     * [Plugin Documentation](#plugin-documentation)
        * [Common Plugin Properties](#common-plugin-properties)
           * [plugin.name](#pluginname)
           * [plugin.initAsync(cb)](#plugininitasynccb)
           * [plugin.defineUnit(adUnit)](#plugindefineunitadunit)
           * [plugin.destroyUnits(units)](#plugindestroyunitsunits)
           * [plugin.loadNewPage()](#pluginloadnewpage)
        * [Ad Server Plugin Properties](#ad-server-plugin-properties)
           * [plugin.type](#plugintype)
           * [plugin.requestAdServer(units)](#pluginrequestadserverunits)
        * [Header Bidding Plugin Properties](#header-bidding-plugin-properties)
           * [plugin.type](#plugintype-1)
           * [plugin.requestBids(units, timeout, cb)](#pluginrequestbidsunits-timeout-cb)
           * [plugin.beforeRequestAdServer(units)](#pluginbeforerequestadserverunits)
  * [API Documentation](#api-documentation)
     * [Plugin Configuration](#plugin-configuration)
     * [GPT Plugin Configuration](#gpt-plugin-configuration)
     * [Prebid Plugin Configuration](#prebid-plugin-configuration)
     * [Public API](#public-api)
        * [sortableads.get(key)](#sortableadsgetkey)
        * [sortableads.set(key, val)](#sortableadssetkey-val)
        * [sortableads.defineAds(adConfigs)](#sortableadsdefineadsadconfigs)
        * [sortableads.requestAds(elementIds)](#sortableadsrequestadselementids)
        * [sortableads.getRequestedElementIds()](#sortableadsgetrequestedelementids)
        * [sortableads.requestAds(elementIds)](#sortableadsrequestadselementids-1)
        * [sortableads.destroyAds(elementIds)](#sortableadsdestroyadselementids)
        * [sortableads.loadNewPage()](#sortableadsloadnewpage)
        * [sortableads.use(plugin)](#sortableadsuseplugin)
        * [sortableads.useGPTAsync(option)](#sortableadsusegptasyncoption)
        * [sortableads.usePrebidForGPTAsync()](#sortableadsuseprebidforgptasync)
        * [sortableads.useSortableForGPTAsync()](#sortableadsusesortableforgptasync)
        * [sortableads.start()](#sortableadsstart)
        * [sortableads.addEventListener(type, listener)](#sortableadsaddeventlistenertype-listener)
        * [sortableads.removeEventListener(type, listener)](#sortableadsremoveeventlistenertype-listener)
        * [sortableads.version](#sortableadsversion)
        * [sortableads.apiReady](#sortableadsapiready)
        * [sortableads.push(fn)](#sortableadspushfn)

## Ad Manager

The ad manager is a utility library that a publisher can embed on a page to help manage multiple header bidder frameworks on the same page.

The main goals of this library are to:

1. Provide an API that separates the concerns of initializing and configuring various HB solutions, mapping ads to DOM elements, making requests, and rendering ads.
2. Be general enough so as to make it easy to integrate an HB into the framework, yet have its lifecycle explicitly defined and managed by the framework.
3. Play nice with SPA frameworks such as React. The ad lifecycle should be divided into several states that make it easy to integrate with Virtual DOM / Component lifecycle such as in React.

In short, this library will handle the administrative work of managing the life cycle of your ad units, so that requests are made properly.

We have also provided an example of using the Ad Manager API in a React component [here](https://github.com/sortable/react).

### Build (For contributors)

NOTE: As the project is in its early stages, we are not accepting PRs at the moment. However, you are welcome to open issues or feature requests.

To build, you must have NodeJS and NPM installed on your environment.

First, run `npm install` to install all the required dependencies.

Afterwards, the available commands to run are:

* `npm run clean` - clean distributable artifacts
* `npm run build` - build distributable artifacts
* `npm run serve` - build and serve from root folder at localhost:9000/
* `npm run test` - run tests with MochaJS

Examples will be hosted at localhost:9000/examples/*
HTML documentation will be hosted at localhost:9000/docs/

### Usage (For consumers)

NOTE: If you are already a Sortable customer, please consult with your account manager to find the best way to integrate with Ads Manager.

To consume this package as an [NPM](https://www.npmjs.com/package/@sortable/ads) module:

`npm install @sortable/ads --save`

Then, using a module loader that supports either CommonJS or ES2015 modules, such as [webpack](https://webpack.js.org/):

```javascript
// Using ES6 transpiler
import '@sortable/ads';

// Not using ES6 transpiler
require('@sortable/ads');

// use the API via global variable
sortableads.method
...
```

Note that unlike most NPM modules that expose functionality, this module simply instantiates a global variable **sortableads** and populates it with the public API calls.

For easy **testing**, you can also consume the library by including the JavaScript bundle as provided by a CDN:

`<script src="https://cdn.jsdelivr.net/npm/@sortable/ads@x.x.x/dist/sortableads.min.js" async/>`

where x.x.x can be changed to whichever version of the API you wish to use. However, note that this link should **NOT** be used in production. You can download the Ads Manager script and serve it from your web hosting server.

Note that if you are loading the script asynchronously, you should include the following script and define sortableads before you use it:

`<script> var sortableads = sortableads || [];  </script>`

In the asynchronous use case, wrap all API calls in a callback, and add it to the sortableads queue:

```javascript
sortableads.push(() => {
  sortableads.method
  ...
});
```

## Example Integrations

The [examples](/examples) directory contains some example integrations using the Ad Manager.

## How to Debug

You can pass in query parameters to enable debugging for Ads Manager.

* `?sortableads_debug=true`
* `?sortableads_debug=false`
* `?sortableads_debug=true_storage`
* `?sortableads_debug=false_storage`

Ads Manager will look for the query string to determine whether or not to enable/disable debugging. The _storage variants will cause your selection to be persisted through LocalStorage. Afterwards, if the query string is not passed, Ads Manager will look under LocalStorage to check the persistant value for debugging.

Once debugging is turned on, Ads Manager will perform logging when certain events occur by default. You can filter for only logging statements by the prefix **SORTABLEADS**.

To add logging on additional events, use the addEventListener method with the following events:

| Event                     | Description                                                                    |
|---------------------------|--------------------------------------------------------------------------------|
| eventListenerError        | There was an error in an event handler.                                        |
| error                     | The API was not used as expected, and further behaviour may be undefined.      |
| warning                   | The API may have been used incorrectly, but further behaviour will be defined. |
| updateSetting             | An Ads Manager setting is changed.                                             |
| defineAds                 | Start defining ads for all header bidders.                                     |
| requestAds                | Start requesting ads for all header bidders.                                   |
| destroyAds                | Start destroying ads for all header bidders.                                   |
| loadNewPage               | A new page is loaded.                                                          |
| usePlugin                 | A plugin is registered.                                                        |
| start                     | Start the header bidding process.                                              |
| noUnitDefined             | No ad units are defined.                                                       |
| requestUndefinedAdWarning | An undefined ad was requested.                                                 |
| requestBidsTimeout        | A header bidder timed out from initialization or sending bid requests.         |

Example of Default Output:

![Default debug example output](/screenshots/debug-output.png "Default debug example output")

## Plugin Usage

Plugins are what Ads Manager uses to communicate with header bidders and ad servers. Ads Manager comes with a ready to use GPT Async plugin for an ad server integration, and a Prebid plugin for a header bidder integration.

### How to use GPT Async Plugin

To use the GPT async plugin:
1. `sortableads.defineAds(`[AdConfig](#plugin-configuration)`)`
2. `sortableads.useGPTAsync(`[option](#sortableadsusegptasyncsyncoption)`)`
3. `sortableads.start()`

See the [GPT](/examples/gpt-only.html) example integration for working code, and the configuration section for how to configure the plugin.

**Note**: Under the hood, `useGPTAsync` will push commands to GPT's command queue, calling GPT methods such as [disableInitialLoad], [enableSingleRequest] and [enableServices]. The user should not have to call GPT methods manually. However, if custom GPT calls are necessary, they should be pushed to the command queue **before** `useGPTAsync` is called.

[disableInitialLoad]: https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_disableInitialLoad
[enableSingleRequest]: https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_enableSingleRequest
[enableServices]: https://developers.google.com/doubleclick-gpt/reference#googletag.enableServices

### How to use Prebid for GPT Async Plugin

To use the GPT async plugin:
1. `sortableads.defineAds(`[AdConfig](#plugin-configuration)`)`
2. `sortableads.usePrebidForGPTAsync()`
3. `sortableads.start()`

See the [Prebid for GPT](/examples/gpt-and-prebid.html) example integration for working code, and the configuration section for how to configure the plugin.

## Plugin Implementation

### How to write your own Header Bidding Plugin

The provided prebid-for-gpt-async plugin is a good example to follow. In general, the steps to write a plugin are:

1. Create a Javascript object that implements the following properties:
    * [name](#pluginname)
    * [initAsync](#plugininitasynccb)
    * [defineUnit](#plugindefineunitadunit)
    * [requestBids](#pluginrequestbidsunits-timeout-cb)
    * [beforeRequestAdServer](#pluginbeforerequestadserverunits)
2. Add the properties you require to the [AdConfig](#plugin-configuration) object.
3. Pass your AdConfig to defineAds(config).
4. Register your plugin with `sortableads.use(plugin)`.

### Plugin Documentation

All interaction with the external services that Ads Manager connects to should be encapsulated within a Plugin. There are 2 types of plugins: one for header bidding, and one for ad servers. These plugins expose slightly different interfaces.

However, both implement the following properties:

#### Common Plugin Properties

##### `plugin.name`
* **Scope**: Required
* **Type**: string
* **Description**: The name of the service that this plugin enables.

---

##### `plugin.initAsync(cb)`

* **Scope**: Required
* **Type**: function
* **Description**: This should define the process of initializing a particular service in an asynchronous fashion. The callback `cb` is passed by the API and should only be called once the service has been initialized successfully.
* **Request Params**:

  | Param | Scope    | Type     | Description                   |
  |-------|----------|----------|-------------------------------|
  | cb    | Required | function | function invoked on callback. |
* **Example**:
```javascript
let plugin = {
  initAsync: (cb) => {
    window.googletag = window.googletag || {};
    window.googletag.cmd = window.googletag.cmd || [];
    window.googletag.cmd.push(() => {
      ...google related initialization...
      cb(); // googletag is instantiated here
    });
  },
  ...
};
```

---

##### `plugin.defineUnit(adUnit)`

* **Scope**: Required
* **Type**: function
* **Description**: This should define the process of creating an "ad unit" as specified by a particular service. The "ad unit" should bundle all information that is required to include in a request to the service, and should be associated with the div that the ad should slot into.
* **Returns**: Object, representing an "ad unit"
* **Request Params**:

  | Param     | Scope    | Type     | Description             |
  |-----------|----------|----------|-------------------------|
  | adConfig  | Required | function | ad unit [config] object |
[config]: #plugin-configuration
* **Example**:
```javascript
let plugin = {
  defineUnit: adConfig => {
    const GPTConfig = adConfig.GPT;
    const sizes = GPTConfig.sizes || adConfig.sizes;
    const slot = googletag.defineSlot(GPTConfig.adUnitPath, sizes, GPTConfig.elementId);
    slot.addService(googletag.pubads());
    return slot;
  },
  ...
};
```

---

##### `plugin.destroyUnits(units)`

* **Scope**: Optional
* **Type**: function
* **Description**: This method implements the process of "destroying" an ad unit. Sometimes, the definition or creation of an ad unit may cause side effects. This method can be used to perform necessary cleanup when the associated div is removed from the DOM, as occurs in the case of virtual DOM manipulation or management.
* **Request Params**:

  | Param | Scope    | Type          | Description                                   |
  |-------|----------|---------------|-----------------------------------------------|
  | units | Required | Array[Object] | array of ad units as returned from defineUnit |

---

##### `plugin.loadNewPage()`

* **Scope**: Optional
* **Type**: function
* **Description**: This method is used to define how to interact with the service when a new page view should occur programmatically. Similar to destroyUnits, some cleanup, reinitialization, or refresh logic may need to be applied on the existing/defined ad units in order to synchronize them with the service.

---

#### Ad Server Plugin Properties

The ad server is the final destination in the header bidding process. This plugin should implement how to make a request to the ad server. There can only be one AdServerPlugin attached to Ads Manager. The following are properties specific to Ad Server Plugins:

##### `plugin.type`

* **Scope**: Required
* **Type**: string
* **Description**: The type of the plugin is `'adServer'`, set by default.

##### `plugin.requestAdServer(units)`

* **Scope**: Required
* **Type**: function
* **Description**: This method implements the process of making a request to the ad server. Ideally, the ad unit type should already be in the correct format for the request. If the ad server API has different ways of making requests due to different configurations, this method should handle that as well.
* **Request Params**:

  | Param | Scope    | Type          | Description                                   |
  |-------|----------|---------------|-----------------------------------------------|
  | units | Required | Array[Object] | array of ad units as returned from defineUnit |
* **Example**:
```javascript
let plugin = {
  ...
  requestAdServer: slots => {
    googletag.pubads().refresh(slots);
  },
  ...
};
```

#### Header Bidding Plugin Properties

A header bidder bids on your inventory. This plugin should implement how to send bid requests to the header bidder. The following are properties specific to Ad Server Plugins:

##### `plugin.type`

* **Scope**: Required
* **Type**: string
* **Description**: The type of the plugin is `'headerBidding'`, set by default.

##### `plugin.requestBids(units, timeout, cb)`

* **Scope**: Required
* **Type**: function
* **Description**: This method implements sending the request to the header bidding service. The callback `cb` should be called by the service after receiving the bid response.
* **Request Params**:

  | Param   | Scope    | Type          | Description                                           |
  |---------|----------|---------------|-------------------------------------------------------|
  | units   | Required | Array[Object] | array of ad units as returned from `defineUnit`       |
  | timeout | Required | number        | timeout in ms to wait for header bidder               |
  | cb      | Required | function      | function which should be called when request finished |
* **Example**:
```javascript
let plugin = {
  ...
  requestBids: (adUnits, timeout, done) => {
    pbjs.requestBids({
      timeout,
      adUnits,
      bidsBackHandler: () => {
        done();
      },
    });
  },
  ...
};
```

##### `plugin.beforeRequestAdServer(units)`

* **Scope**: Required
* **Type**: function
* **Description**: This method is called for every header bidder before Ads Manager makes a request to the ad server. It should be used to perform any header-bidder specific setup for the ad server request.
* **Request Params**:

  | Param | Scope    | Type          | Description                                     |
  |-------|----------|---------------|-------------------------------------------------|
  | units | Required | Array[Object] | array of ad units as returned from `defineUnit` |
* **Example**:
```javascript
let plugin = {
  ...
  beforeRequestAdServer: adUnits => {
    pbjs.setTargetingForGPTAsync(adUnits);
  },
  ...
};
```

## API Documentation

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

---

### Public API

#### sortableads.get(key)

Get the value associated with given key. The return value will be undefined if the key doesn't exist. This generic map is used to configure Ads Manager in an extensible way.

**Returns**: `object` - the value for the key, can be arbitrary type

**Valid Keys**:

| Key Name        | Value Type |
|-----------------|------------|
| bidderTimeout   | number     |
| throttleTimeout | number     |

**Request Params**:

| Param | Scope    | Type   | Description       |
|-------|----------|--------|-------------------|
| key   | Required | string | key of config map |

---

#### sortableads.set(key, val)

Associate given value with given key. As with `get`, only valid keys and their corresponding return types shown above should be used.

**Request Params**:

| Param | Scope    | Type   | Description       |
|-------|----------|--------|-------------------|
| key   | Required | string | key of config map |
| val   | Required | object | value for the key |

---

#### sortableads.defineAds(adConfigs)

Takes in a list of ad configs, one for each "ad unit". Each ad config contains all properties required for header bidders (ex. Prebid) and ad servers (ex. GPT) to define that ad unit for their request. See [Plugin Configuration](#plugin-configuration) for more information on how AdConfig is defined.

**Request Params**:

| Param     | Scope    | Type            | Description                        |
|-----------|----------|-----------------|------------------------------------|
| adConfigs | Required | Array[AdConfig] | array of AdConfig for each ad unit |

---

#### sortableads.requestAds(elementIds)

Request ads for the list of DOM element ids. This method is throttled and queues requests, so it can be called multiple times.

**Request Params**:

| Param      | Scope    | Type          | Description          |
|------------|----------|---------------|----------------------|
| elementIds | Required | Array[string] | array of element ids |

---

#### sortableads.getRequestedElementIds()

**Returns**: Array[string]

Get all requested ad element ids.

---

#### sortableads.requestAds(elementIds)

Request ads for the list of DOM element ids. This method is throttled and queues requests, so it can be called multiple times. Ad requests will be queued until `sortableads.start` is called.

**Request Params**:

| Param      | Scope    | Type          | Description          |
|------------|----------|---------------|----------------------|
| elementIds | Required | Array[string] | array of element ids |

---

#### sortableads.destroyAds(elementIds)

Command to destroy given ads.

**Request Params**:

| Param      | Scope    | Type          | Description          |
|------------|----------|---------------|----------------------|
| elementIds | Required | Array[string] | array of element ids |

---

#### sortableads.loadNewPage()

Used to declare a new pageview for the SPA use case.

---

#### sortableads.use(plugin)

Takes a plugin and registers it for use with Ads Manager. The plugin consists of settings for either a header bidder, or an ad server. An ad server plugin can only be registered once.

**Request Params**:

| Param  | Scope    |Type    | Description                                  |
|--------|----------|--------|----------------------------------------------|
| plugin | Required | Object | See [plugin configuration] for more details. |

[plugin configuration]: #plugin-configuration

---

#### sortableads.useGPTAsync(option)

Use a provided out-of-the-box GPT plugin that works with asynchronous usage of GPT and takes some initialization options.

**Optional Parameters**

| Property            | Scope    | Type    | Default |
|---------------------|----------|---------|---------|
| enableSingleRequest | Optional | boolean | true    |
| disableInitialLoad  | Optional | boolean | true    |

**Request Params**:

| Param  | Scope    |Type    | Description                             |
|--------|----------|--------|-----------------------------------------|
| option | Required | Object | Optional initial configuration for GPT. |

---

#### sortableads.usePrebidForGPTAsync()

Use a provided out-of-the-box GPT-compatible Prebid HB plugin.

---

#### sortableads.useSortableForGPTAsync()

Use a provided out-of-the-box GPT-compatible Sortable HB plugin.

---

#### sortableads.start()

Ad requests to header bidders will be queued until `start` is called.

---

#### sortableads.addEventListener(type, listener)

Add an event listener for a specified type of event. See the [debugging](#how-to-debug) section for more information.

**Request Params**:

| Param     | Scope    |Type      | Description                         |
|-----------|----------|----------|-------------------------------------|
| type      | Required | Object   | The event type.                     |
| listener  | Required | function | The function to invoke on callback. |

---

#### sortableads.removeEventListener(type, listener)

Remove an event listener if it was previously registered via addEventListener.

**Request Params**:

| Param     | Scope    |Type      | Description                         |
|-----------|----------|----------|-------------------------------------|
| type      | Required | Object   | The event type.                     |
| listener  | Required | function | The function to invoke on callback. |

---

#### sortableads.version

The version of the Ads Manager API, which should match the NPM versioning.

---

#### sortableads.apiReady

A flag which should be used to determine if the Ads Manager API is ready to use.

---

#### sortableads.push(fn)

Prior to initialization, API calls should be pushed as callbacks for the sortableads array. These will be called by the API once it initializes. Using push after the API initializes will simply execute the function passed.

**Request Params**:

| Param | Scope    |Type      | Description                         |
|-------|----------|----------|-------------------------------------|
| fn    | Required | function | The function to invoke on callback. |

---
