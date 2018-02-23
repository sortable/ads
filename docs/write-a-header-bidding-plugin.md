# Write a Header Bidding Plugin

The provided prebid-for-gpt-async plugin is a good example to follow. In general, the steps to write a plugin are:

1. Create a Javascript object that implements the following properties:
  * [name](#pluginname)
  * [type](#plugintype)
  * [initAsync](#plugininitasynccb)
  * [defineUnit](#plugindefineunitadunit)
  * [requestBids](#pluginrequestbidsunits-timeout-cb)
  * [beforeRequestAdServer](#pluginbeforerequestadserverunits)
2. Add the properties you require to the [AdConfig](#plugin-configuration) object.
3. Pass your AdConfig to defineAds(config).
4. Register your plugin with `sortableads.use(plugin)`.

## Header Bidding Plugin Properties

A header bidder bids on your inventory. This plugin should implement how to send bid requests to the header bidder. The following are properties specific to Ad Server Plugins:

### `plugin.name`
* **Scope**: Required
* **Type**: string
* **Description**: The name of the service that this plugin enables.

### `plugin.type`

* **Scope**: Required
* **Type**: string
* **Description**: The type of the plugin is `'headerBidding'`, set by default.

### `plugin.initAsync(cb)`

* **Scope**: Required
* **Type**: function
* **Description**: This should define the process of initializing a particular service in an asynchronous fashion. The callback `cb` is passed by the API and should only be called once the service has been initialized successfully.

* **Params**:

| Param | Scope    | Type     | Description                   |
|-------|----------|----------|-------------------------------|
| cb    | Required | function | function invoked on callback. |

* **Example**:

```js
let plugin = {
  initAsync: (cb) => {
    window.pbjs = window.pbjs || {};
    window.pbjs.que = window.pbjs.que || [];
    window.pbjs.que.push(() => {
      ... pbjs related initialization ...
      cb();
    });
  },
  ...
};
```

### `plugin.defineUnit(adUnit)`

* **Scope**: Required
* **Type**: function
* **Description**: This should define the process of creating an "ad unit" as specified by a particular service. The "ad unit" should bundle all information that is required to include in a request to the service, and should be associated with the div that the ad should slot into.
* **Returns**: Object, representing an "ad unit"
* **Params**:

| Param     | Scope    | Type     | Description             |
|-----------|----------|----------|-------------------------|
| adConfig  | Required | function | ad unit [config] object |

[config]: #plugin-configuration

* **Example**:

```js
let plugin = {
  ...
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

### `plugin.requestBids(units, timeout, cb)`

* **Scope**: Required
* **Type**: function
* **Description**: This method implements sending the request to the header bidding service. The callback `cb` should be called by the service after receiving the bid response.

* **Params**:

| Param   | Scope    | Type          | Description                                           |
|---------|----------|---------------|-------------------------------------------------------|
| units   | Required | Array[Object] | array of ad units as returned from `defineUnit`       |
| timeout | Required | number        | timeout in ms to wait for header bidder               |
| cb      | Required | function      | function which should be called when request finished |

* **Example**:

```js
let plugin = {
  ...
  requestBids: function (adUnits, timeout, done) {
    pbjs.requestBids({
      timeout,
      adUnits,
      bidsBackHandler: function () {
        done();
      },
    });
  },
  ...
};
```

### `plugin.beforeRequestAdServer(units)`

* **Scope**: Required
* **Type**: function
* **Description**: This method is called for every header bidder before Ads Manager makes a request to the ad server. It should be used to perform any header-bidder specific setup for the ad server request.

* **Params**:

| Param | Scope    | Type          | Description                                     |
|-------|----------|---------------|-------------------------------------------------|
| units | Required | Array[Object] | array of ad units as returned from `defineUnit` |

* **Example**:

```js
let plugin = {
  ...
  beforeRequestAdServer: adUnits => {
    pbjs.setTargetingForGPTAsync(adUnits);
  },
  ...
};
```

### `plugin.destroyUnits(units)`

* **Scope**: Optional
* **Type**: function
* **Description**: This method implements the process of "destroying" an ad unit. Sometimes, the definition or creation of an ad unit may cause side effects. This method can be used to perform necessary cleanup when the associated div is removed from the DOM, as occurs in the case of virtual DOM manipulation or management.

* **Params**:

| Param | Scope    | Type          | Description                                   |
|-------|----------|---------------|-----------------------------------------------|
| units | Required | Array[Object] | array of ad units as returned from defineUnit |

### `plugin.loadNewPage()`

* **Scope**: Optional
* **Type**: function
* **Description**: This method is used to define how to interact with the service when a new page view should occur programmatically. Similar to destroyUnits, some cleanup, reinitialization, or refresh logic may need to be applied on the existing/defined ad units in order to synchronize them with the service.
