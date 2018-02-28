# Use Sortable Plugin

---

?> [sortable.com](https://sortable.com) provides monetization and analytics solutions. [Contact us](https://sortable.com/contact-us/) if you are interested.

## Load Plugin in Configuration

> * Step 0: setup GPT plugin
> * Step 1: load Sortable plugin via `sortableads.useSortableForGPTAsync()`


```js
sortableads.push(function() {
  sortableads.useGPTAsync();

  // Step 1: load Sortable plugin
  sortableads.useSortableForGPTAsync();

  sortableads.defineAds([{
    elementId: "div-gpt-ad-123456789-0",
    sizes: [728, 90],
    GPT: {
      adUnitPath: "/19968336/header-bid-tag-0",
      targeting: {
        "interests": ["sports", "music", "movies"]
      }
    }
  }]);

  sortableads.start();
});
```

## Full Example

[](//jsfiddle.net/vqv8r7np/166/embedded/html,result/?sortableads_debug=true ':include :type=iframe width=100% height=700 allowpaymentrequest allowfullscreen frameborder=0')
