
**WARNING: These libraries are under development and only availiable to select Sortable customers.**

# Sortable Ads

This repo contains libraries, examples and documentation for publishers integrating the Sortable ad framework into their sites.

## Ad Manager

The ad manager is a utility library that a publisher can embed on a page to help manage multiple header bidder frameworks on the same page.

The main goals of this library are to:

1. Provide an API that separates the concerns of initializing and configuring various HB solutions, mapping ads to DOM elements, making requests, and rendering ads.
2. Be general enough so as to make it easy to integrate an HB into the framework, yet have its lifecycle explicitly defined and managed by the framework.
3. Play nice with SPA frameworks such as React. The ad lifecycle should be divided into several states that make it easy to integrate with Virtual DOM / Component lifecycle such as in React.

In short, this library will handle the administrative work of managing the life cycle of your ad units, so that requests are made properly.

We have also provided an example of using the Ad Manager API in a React component [here](https://github.com/sortable/react).

### Build

To build, you must have NodeJS and NPM installed on your environment.

First, run `npm install` to install all the required dependencies.

Afterwards, the available commands to run are:

* `npm run clean` - clean distributable artifacts
* `npm run build` - build distributable artifacts
* `npm run serve` - build and serve from root folder at localhost:9000/
* `npm run test` - run tests with MochaJS

Examples will be hosted at localhost:9000/examples/*
HTML documentation will be hosted at localhost:9000/docs/

### Usage

#### NPM

To consume this package as an NPM module, include the following line:

ES6: `import @sortable/ads;`

CommonJS: `require('@sortable/ads');`

Unlike many NPM modules that expose functionality, this module simply instantiates a global variable **sortableads** and populates it with the public API calls.

#### Include script

You can also consume the library by including the Javascript bundle as provided by NPM's CDN:

`<script src="https://cdn.jsdelivr.net/npm/@sortable/ads@x.x.x/dist/sortableads.min.js" async/>`

where x.x.x can be changed to whichever version of the API you wish to use.

In this case, you should include the following script so that the global variable sortableads is defined before you use it:

`<script> var sortableads = sortableads || [];  </script>`

## API Documentation

### Types

#### CallbackFunction

This is a typedef of `() => void`.

#### Config<T>

A config is an object containing a common set of methods that should be registered by the API to define the workflow for initialization, creation of "ad units", and sending valid requests for a particular service, such as GPT, Prebid or Sortable Enterprise.

We differentiate between configs used for GPT and HBs as GPTConfig and HBConfig respectively.

However, both contains the following methods:

**Required**

`init: (cb: CallbackFunction) => void`

This should define the process of initializing a particular service. The callback `cb` is passed by the API and should only be called once the service has been initialized successfully.

Example:

```javascript
let config = {
  init: () => {
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

`defineUnit: (divId: string) => T | null | undefined`

This should define the process of creating an "ad unit" as specified by a particular service. The type of the "ad unit" T should bundle all information that is required to include in a request to the service, and should be associated with the div that the ad should slot into. Some services may take more control in the process of creating what we can define as an ad slot.

Example:

```javascript
let config = {
  defineUnit(divId) {
    if (divId === 'divIdName') {
      // associate the googletag Slot with the div id, and pass all the necessary information to define the slot
      return window.googletag.defineSlot('/6355419/Travel/Europe/France/Paris',
          [300, 250], divId).addService(window.googletag.pubads());
    }
  },
  ...
};
```

`requestHB/requestGPT: (context: HB/GPTContext<T>) => void`

These methods implement the process of actually making a request to an HB or GPT. The provided `context` should provide the "ad units" in the right format for the request. Only one of these methods should exist at a time: `requestHB` for `HBConfig`, and `requestGPT` for `GPTConfig`.

Example:

```javascript
requestHB(context) {
  context.beforeRequestGPT = function () {
    window.pbjs.setTargetingForGPTAsync(context.ids);
  };
  window.pbjs.requestBids({
    // context.units is created from defineUnit above
    adUnits: context.units,
    timeout: context.timeout,
    bidsReadyHandler() {
      // call context.done() when request finished
      context.done();
    }
  });
}
```

**Optional**

`destroyUnits: (units: T[]) => void`

This method implements the process of "destroying" an ad unit. Sometimes, the definition or creation of an ad unit may cause side effects. This method can be used to perform necessary cleanup when the associated div is removed from the DOM, as occurs in the case of virtual DOM manipulation or management.

`loadNewPage: () => void`

This method is used to define how to interact with the service when a new page view should occur programmatically. Similar to destroyUnits, some cleanup, reinitialization, or refresh logic may need to be applied on the existing/defined ad units in order to synchronize them with the service.

#### Context<T>

The Context contains the ad units which hold all the information required to make a request to the service.

Again, we differentiate the Context using GPTContext and HBContext. Most of the properties are read-only, but some should HB specific properties should be supplied in the `requestHB` method.

The following are common for GPT and HB, and are read-only properties:

`ids: string[]`

List of all element ids requested that were processed for this context.

`newIds: string[]`

List of new element ids that were requested as compared to the previous context.

`newUnits: T[]`

List of new ad units mapped by index with `newIds`.

`refreshIds: string[]`

Analagous to `newIds`, but for existing element ids.

`refreshUnits: T[]`

Analagous to `newUnits`, but for existing ad units.

`units: T[]`

List of all ad units.

**HB Specific Properties**

`timeout: number`

This is the user-supplied timeout in ms that should be provided as part of the request to the HB.

`done: () => void`

This method is provided by the API and should only be called when an HB is finished with its request. If you need to modify this function to additional perform functionality, make sure to invoke the original method in the new one.

Example:

```javascript
origFn = context.done;
context.done = () => {
  ...additional functionality...
  origFn();
}
```

`beforeRequestGPT: () => void`

This method should be user-supplied, and should set targeting for GPT based on the results returned from the HB. This method will run before sending a request to GPT.

Example:

```javascript
requestHB(context) {
  context.beforeRequestGPT = function () {
    window.pbjs.setTargetingForGPTAsync(context.ids);
  };
  ...make the request...
}
```

### Public API Methods

`getVersion(): string`

Get the API version.

`getDebug(): boolean`

Get the debug flag.

`setDebug(value: boolean): void`

Set the debug flag. If debugging is enabled, listeners are registered on certain lifecycle events to log the details.

`getBidderTimeout(): number`

 Get the bidder timeout in ms.

`setBidderTimeout(timeout: number): void`

Set the bidder timeout in ms. It is how long the API waits for header bidders before sending the results as targeting to GPT/DFP.

`getRequestedElementIds(): string[]`

Get all requested ad element ids.

`requestAds(elementIds: string[]): void`

Request ads for the list of DOM element ids. This method is throttled and queues requests, so it can be called multiple times.

`destroyAds(elementIds: string[]): void`

Command to destroy given ads.

`loadNewPage(): void`

Used to declare a new pageview for the SPA use case.

`registerGPT(config: GPTConfig<GoogletagSlot>): void`

Register GPT with the GPTConfig object given. GPT can only be registered once. Upon registration, queued ad requests are resumed.

`registerHB(config: HBConfig<any>): void`

Register HB with the HBConfig object given.

`addEventListener<K extends EventKey>(type: K, listener: EventListener<K>): void`

Add an event listener for a specified type of event. Useful for debugging.

`removeEventListener<K extends EventKey>(type: K, listener: EventListener<K>): void`

Remove an event listener if it was previously registered via addEventListener.

`apiReady: boolean | undefined`

A flag which should be used to determine if the Ads Manager API is ready to use.

`push(fn: () => void): number`

Prior to initialization, API calls should be pushed as callbacks for the sortableads array. These will be called by the API once it initializes.

## Common Mistakes

Ensure that any required external scripts are included in the HTML. For example, the GPT library should be loaded in the head of the document. Many libraries will provide a global command queue to enqueue callbacks to run when they are loaded successfully.

Example:

```html
<html>
  <head>
    <!-- Make sure you include GPT before using it! -->
    <script src="https://www.googletagservices.com/tag/js/gpt.js" async/>
  </head>
</html>
```

Ensure that API calls which interact with DOM elements are run after such elements are loaded. The easiest way to do this is to load the script synchronously before the end of the body tag, after the elements it depends on have been loaded. Alternatively, set-up code can be run in the head of the document, with each ad div containing an inline script to push a callback to requestAds on the sortableads queue. This will request the ad as each ad div finishes loading.

Examples:

**Synchronous**

```html
<html>
  <head>
    ...
  </head>
  <body>
    ...
    <div id="ad-slot-1"/>
    <div id="ad-slot-2"/>
    <div id="ad-slot-3"/>
    <!-- This is not async! -->
    <script src="https://cdn.jsdelivr.net/npm/@sortable/ads@x.x.x/dist/sortableads.min.js"/>
    <script>
      ...configure API and request ads here...
    </script>
  </body>
</html>
```

**Asynchronous**

```html
<html>
  <head>
    <!-- This is async! -->
    <script src="https://cdn.jsdelivr.net/npm/@sortable/ads@x.x.x/dist/sortableads.min.js" async/>
    <script>
      // define sortableads if necessary, and only perform API calls within callbacks
      sortableads = sortableads || [];
      sortableads.push(() => {
        sortableads.setBidderTimeout(300);
      });
    </script>
  </head>
  <body>
    ...
    <div id="ad-slot-1">
      <script>
        // callbacks should be used everywhere in the asynchronous scenario
        sortableads.push(() => {
          sortableads.requestAds(['ad-slot-1']);
        });
      </script>
    </div>
  </body>
</html>
```

Ensure that when defining init(cb), the callback cb is called in an enqueued function to inform the Ads Manager API that the service is ready. If the callback is called too early, or not called at all, the HB will eventually timeout.

Example:
```javascript
let config = {
  init: () => {
    window.googletag = window.googletag || {};
    window.googletag.cmd = window.googletag.cmd || [];
    window.googletag.cmd.push(() => {
      ...google related initialization...
      // CORRECT
      cb(); // googletag is definitely initialized here!
    });
    // INCORRECT
    cb(); // googletag may not be initialized here!
  },
  ...
};
```

Ensure that Context.done() is called in Config.requestHB after receiving the bids. Not doing so will cause the HB to timeout, and the context to be discarded from setting targeting for GPT.

Ensure that Context.beforeRequestGPT is supplied in Config.requestHB. The supplied callback will run after all HBs have made their requests, and before sending the results to GPT. The user should define how to set targeting on the ad slots in this callback.

## Example Integrations

The [examples](/examples) directory contains some example integrations using the Ad Manager.

## Sortable Container API

The DeployAds API in [src/types.d.ts](/src/types.d.ts) documents the types for the Sortable container API. Although it's recommended to use this API in combination with the ad manager, it's provided for reference.
