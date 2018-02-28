# Use GPT Plugin

---

## Installation & Initialization

> * Add GPT script link to HTML page.
> * Initialize `googletag` global variable.

```html
<html>
  <head>
    <script async src="https://www.googletagservices.com/tag/js/gpt.js"></script>
    <script>
      var googletag = googletag || {};
      googletag.cmd = googletag.cmd || [];
    </script>
  </head>
</html>
```
To use the GPT async plugin:

1. `sortableads.defineAds(`[AdConfig](#plugin-configuration)`)`
2. `sortableads.useGPTAsync(`[option](#sortableadsusegptasyncsyncoption)`)`
3. `sortableads.start()`

See the [GPT](/examples/gpt-only.html) example integration for working code, and the configuration section for how to configure the plugin.

**Note**: Under the hood, `useGPTAsync` will push commands to GPT's command queue, calling GPT methods such as [disableInitialLoad], [enableSingleRequest] and [enableServices]. The user should not have to call GPT methods manually. However, if custom GPT calls are necessary, they should be pushed to the command queue **before** `useGPTAsync` is called.

[disableInitialLoad]: https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_disableInitialLoad
[enableSingleRequest]: https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_enableSingleRequest
[enableServices]: https://developers.google.com/doubleclick-gpt/reference#googletag.enableServices
