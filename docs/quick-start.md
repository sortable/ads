# Quick Start

!> This guide is only availiable for selected Sortable's customer at the moment.

## Installation & Initialization

> * Add Sortable provided CDN link to HTML page.
> * Initialize `sortableads` global variable.

```html
<html>
  <head>
    <!-- NOTE: replace following link with Sortable provided CDN link -->
    <script async src="//tags-cdn.deployads.com/a/sortable-demo-only.com.js"></script>
    <script> var sortableads = sortableads || []; </script>
  </head>
  <body>
    ...
  </body>
</html>
```

## Configuration

> * **Step 1**: load plugins
> * **Step 2**: define ads
> * **Step 3**: start serving ads

```js
sortableads.push(function() {
  // Step 1: load GPT plugin
  sortableads.useGPTAsync();

  // Step 2: define ads with GPT configuration
  sortableads.defineAds([{
    elementId: 'div-id-1',
    sizes: [300, 250],
    GPT: {
      adUnitPath: '/1234/abcd'
    }
  }]);

  // Step 3: start serving ads
  sortableads.start();
});
```

## Request Ads

> * Send requests when element is ready.
> * If only ad server plugin is used, it will send request to
> ad server immediately.
> * If both header bidder and ad server plugin are used, it will send request for
> header bidding, wait all responses (or until it's timeout), and then send request to ad server.

```html
<div id="div-id-1">
  <script>
    sortableads.push(function() {
      sortableads.requestAds(['div-id-1']);
    });
  </script>
</div>
```

## Full Examples

Check out [HERE](https://github.com/sortable/ads/tree/master/examples).

## Live Examples

#### Basic Example

[Basic Example](//jsfiddle.net/vqv8r7np/9/embedded/html,result/?sortableads_debug=true ':include :type=iframe width=100% height=700 allowpaymentrequest allowfullscreen frameborder=0')

#### Refresh Ads by Time

[Time Refresh Example](//jsfiddle.net/vqv8r7np/28/embedded/html,result/ ':include :type=iframe width=100% height=700 allowpaymentrequest allowfullscreen frameborder=0')

#### Refresh Ads by User Interaction

[User Interaction Refresh Example](//jsfiddle.net/vqv8r7np/38/embedded/html,result/ ':include :type=iframe width=100% height=700 allowpaymentrequest allowfullscreen frameborder=0')
