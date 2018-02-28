# Write a Header Bidding Plugin

---

## Reference Implementation

We have two built-in header bidding plugins:

* [Prebid Plugin](https://github.com/sortable/ads/blob/master/src/plugin/prebid-for-gpt-async.ts)
* [Sortable Plugin](https://github.com/sortable/ads/blob/master/src/plugin/sortable-for-gpt-async.ts)

## Implementation Guide

In general, the steps to write a plugin are:

1. Create a plugin object that implements the following properties:
  * [name](#name)
  * [type](#type)
  * [initAsync](#initasync)
  * [defineUnit](#defineunit)
  * [requestBids](#requestbids)
  * [beforeRequestAdServer](#beforerequestadserver)
2. Add the properties you require to the [unified object](plugin-system.md#use-one-unified-object-for-all-plugins).
3. Register your plugin with `sortableads.use(plugin)`.
4. Add any external script if needed.

## Header Bidding Plugin Properties

### `name`
* **Scope**: Required
* **Type**: string
* **Description**: The name of the service that this plugin enables.

### `type`

* **Scope**: Required
* **Type**: `"headerBidding"`
* **Description**: Specify that the plugin is a header bidding plugin.

### `initAsync`

* **Scope**: Required
* **Type**: function
* **Description**: This should define the process of initializing a particular service in an asynchronous fashion. The callback `cb` is passed by the API and should only be called once the service has been initialized successfully.

* **Params**:

| Param | Scope    | Type     | Description                   |
|-------|----------|----------|-------------------------------|
| cb    | Required | function | function invoked on callback. |


* **Note**:

!> Ensure the callback `cb` is called in an enqueued function to inform the Ads Manager API that the service is ready. If the callback is called too early, or not called at all, the HB will eventually timeout.

```js
var plugin = {
  initAsync: function(cb) {
    window.googletag = window.googletag || {};
    window.googletag.cmd = window.googletag.cmd || [];
    window.googletag.cmd.push(function () {
      ... google related initialization ...
      // CORRECT
      cb(); // googletag is definitely initialized here!
    });
    // INCORRECT
    cb(); // googletag may not be initialized here!
  },
  ...
};
```

* **Example**:

```js
let plugin = {
  ...
  initAsync: function(cb) {
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

### `defineUnit`

* **Scope**: Required
* **Type**: function
* **Description**: This should define the process of creating an "ad unit" as specified by a particular service. The "ad unit" should bundle all information that is required to include in a request to the service, and should be associated with the div that the ad should slot into.
* **Returns**: Object, representing an "ad unit"
* **Params**:

| Param   | Scope    | Type     | Description             |
|---------|----------|----------|-------------------------|
| object  | Required | function | ad unit [config] object |

[config]: #plugin-configuration

* **Example**:

```js
let plugin = {
  ...
  defineUnit: function(object) {
    const GPTProperties = object.GPT;
    const sizes = GPTProperties.sizes || object.sizes;
    const slot = googletag.defineSlot(GPTProperties.adUnitPath, sizes, object.elementId);
    slot.addService(googletag.pubads());
    return slot;
  },
  ...
};
```

### `requestBids`

* **Scope**: Required
* **Type**: function
* **Description**: This method implements sending the request to the header bidding service. The callback `cb` should be called by the service after receiving the bid response.

* **Params**:

| Param   | Scope    | Type          | Description                                           |
|---------|----------|---------------|-------------------------------------------------------|
| units   | Required | Array[Object] | array of ad units as returned from `defineUnit`       |
| timeout | Required | number        | timeout in ms to wait for header bidder               |
| cb      | Required | function      | function which should be called when request finished |

* **Note**:

!> Ensure that the `done` callback for `HeaderBiddingPlugin.requestBids` is called after receiving the bids. Not doing so will cause the HB to timeout, delaying the request to the ad server.

* **Example**:

```js
let plugin = {
  ...
  requestBids: function(units, timeout, cb) {
    pbjs.requestBids({
      timeout,
      adUnits,
      bidsBackHandler: function() {
        cb();
      },
    });
  },
  ...
};
```



### `beforeRequestAdServer`

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
  beforeRequestAdServer: function(units) {
    pbjs.setTargetingForGPTAsync(units);
  },
  ...
};
```

### `destroyUnits`

* **Scope**: Optional
* **Type**: function
* **Description**: This method implements the process of "destroying" an ad unit. Sometimes, the definition or creation of an ad unit may cause side effects. This method can be used to perform necessary cleanup when the associated div is removed from the DOM, as occurs in the case of virtual DOM manipulation or management.

* **Params**:

| Param | Scope    | Type          | Description                                   |
|-------|----------|---------------|-----------------------------------------------|
| units | Required | Array[Object] | array of ad units as returned from defineUnit |

### `loadNewPage`

* **Scope**: Optional
* **Type**: function
* **Description**: This method is used to define how to interact with the service when a new page view should occur programmatically. Similar to destroyUnits, some cleanup, reinitialization, or refresh logic may need to be applied on the existing/defined ad units in order to synchronize them with the service.
