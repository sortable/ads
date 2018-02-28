# Commen Issues

---

## Missing External Scripts

!> Ensure that any required external scripts are included in the HTML. For example the GPT library should be loaded in the head of the document. Many libraries will provide a global command queue to enqueue callbacks to run when they are loaded successfully.

```html
<html>
  <head>
    <!-- Make sure you include GPT before using GPT Plugin ! -->
    <script async src="https://www.googletagservices.com/tag/js/gpt.js"><script>
  </head>
</html>
```

## Script Loading: Async vs Sync

Ensure that API calls which interact with DOM elements are run after such elements are loaded. The easiest way to do this is to load the script synchronously before the end of the body tag, after the elements it depends on have been loaded. Alternatively, set-up code can be run in the head of the document, with each ad div containing an inline script to push a callback to requestAds on the sortableads queue. This will request the ad as each ad div finishes loading.

!> The asynchronous method should always be used if possible.

**Synchronous**

```html
<html>
  <head>
    ...
  </head>
  <body>
    ...
    <div id="ad-slot-1"></div>
    <div id="ad-slot-2"></div>
    <div id="ad-slot-3"></div>
    <!-- This is not async! -->
    <script src="sortableads.min.js"/>
    <script>
      // configure API, the divs above are loaded...
    </script>
  </body>
</html>
```

**Asynchronous**

```html
<html>
  <head>
    <!-- This is async! -->
    <script src="sortableads.min.js" async></script>
    <script>
      // define sortableads if necessary, and only perform API calls within callbacks
      var sortableads = sortableads || [];
      sortableads.push(function () {
        sortableads.set('bidderTimeout', 300);
      });
    </script>
  </head>
  <body>
    ...
    <div id="ad-slot-1">
      <script>
        // callbacks should be used everywhere in the asynchronous scenario
        sortableads.push(function () {
          sortableads.requestAds(['ad-slot-1']);
        });
      </script>
    </div>
  </body>
</html>
```

## Custom Plugin Initialization

Ensure that when defining `Plugin.initAsync(cb)`, the callback `cb` is called in an enqueued function to inform the Ads Manager API that the service is ready. If the callback is called too early, or not called at all, the HB will eventually timeout.

```javascript
var plugin = {
  initAsync: function (cb) {
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

## Custom Plugin Bids Requesting

Ensure that the `done` callback for `HeaderBiddingPlugin.requestBids` is called after receiving the bids. Not doing so will cause the HB to timeout, delaying the request to the ad server.
