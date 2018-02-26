# Ads Manager @sortable/ads

## `push`

Push the command functionn to global queue and execute it when API is ready.

```js
sortableads.push(function commandFunction() {
  // API is ready to use now.
});
```

## `apiReady`

A flag which should be used to determine if the Ads Manager API is ready to use.

```js
if (sortableads.apiReady) {
  // API is ready to use now.
}
```

## `version`

The version of the Ads Manager API, which should match the NPM versioning.

```js
console.log(sortableads.version); // => "0.0.5"
```

## `get`

Get the value associated with given key. The return value will be undefined if the key doesn't exist.

| Usage                              | Return Type | Descreiption                           |
|------------------------------------|-------------|----------------------------------------|
| `sortableads.get('bidderTimeout')` | number      | Get timeout setting for header bidding |

## `set`

Associate given value with given key.

| Usage                                    | Value Type | Descreiption                           |
|------------------------------------------|------------|----------------------------------------|
| `sortableads.get('bidderTimeout', 1500)` | number     | Set timeout setting for header bidding |

## `use`

Takes a plugin and registers it for use with Ads Manager. The plugin consists of settings for either a header bidder, or an ad server. An ad server plugin can only be registered once.

**Params**:

| Param  | Scope    |Type    | Description                                  |
|--------|----------|--------|----------------------------------------------|
| plugin | Required | Object | See [plugin configuration] for more details. |

[plugin configuration]: #plugin-configuration

## `useGPTAsync`

Use a provided out-of-the-box GPT plugin that works with asynchronous usage of GPT and takes some initialization options.

**Optional Parameters**

| Property            | Scope    | Type    | Default |
|---------------------|----------|---------|---------|
| enableSingleRequest | Optional | boolean | true    |
| disableInitialLoad  | Optional | boolean | true    |

**Params**:

| Param  | Scope    |Type    | Description                             |
|--------|----------|--------|-----------------------------------------|
| option | Required | Object | Optional initial configuration for GPT. |

## `usePrebidForGPTAsync`

Use a provided out-of-the-box GPT-compatible Prebid HB plugin.

## `useSortableForGPTAsync`

Use a provided out-of-the-box GPT-compatible Sortable HB plugin.

## `defineAds`

Takes in a list of ad configs, one for each "ad unit". Each ad config contains all properties required for header bidders (ex. Prebid) and ad servers (ex. GPT) to define that ad unit for their request. See [Plugin Configuration](#plugin-configuration) for more information on how AdConfig is defined.

**Params**:

| Param     | Scope    | Type            | Description                        |
|-----------|----------|-----------------|------------------------------------|
| adConfigs | Required | Array[AdConfig] | array of AdConfig for each ad unit |

## `requestAds`

Request ads for the list of DOM element ids. This method is throttled and queues requests, so it can be called multiple times. Ad requests will be queued until `sortableads.start` is called.

**Params**:

| Param      | Scope    | Type          | Description          |
|------------|----------|---------------|----------------------|
| elementIds | Required | Array[string] | array of element ids |

## `destroyAds`

Command to destroy given ads.

**Params**:

| Param      | Scope    | Type          | Description          |
|------------|----------|---------------|----------------------|
| elementIds | Required | Array[string] | array of element ids |

## `getRequestedElementIds`

**Returns**: Array[string]

Get all requested ad element ids.

## `loadNewPage`

Used to declare a new pageview for the SPA use case.

## `start`

Ad requests will be queued until `start` is called.

## `addEventListener`

Add an event listener for a specified type of event. See the [debugging](#how-to-debug) section for more information.

**Params**:

| Param     | Scope    |Type      | Description                         |
|-----------|----------|----------|-------------------------------------|
| type      | Required | Object   | The event type.                     |
| listener  | Required | function | The function to invoke on callback. |

## `removeEventListener`

Remove an event listener if it was previously registered via addEventListener.

**Params**:

| Param     | Scope    |Type      | Description                         |
|-----------|----------|----------|-------------------------------------|
| type      | Required | Object   | The event type.                     |
| listener  | Required | function | The function to invoke on callback. |
