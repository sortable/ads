
# Write an Ad Server Plugin

---

## Ad Server Plugin Properties

The ad server is the final destination in the header bidding process. This plugin should implement how to make a request to the ad server. There can only be one AdServerPlugin attached to Ads Manager. The following are properties specific to Ad Server Plugins:

### `plugin.type`

* **Scope**: Required
* **Type**: string
* **Description**: The type of the plugin is `'adServer'`, set by default.

### `plugin.requestAdServer(units)`

* **Scope**: Required
* **Type**: function
* **Description**: This method implements the process of making a request to the ad server. Ideally, the ad unit type should already be in the correct format for the request. If the ad server API has different ways of making requests due to different configurations, this method should handle that as well.

* **Params**:

| Param | Scope    | Type          | Description                                   |
|-------|----------|---------------|-----------------------------------------------|
| units | Required | Array[Object] | array of ad units as returned from defineUnit |

* **Example**:

```js
let plugin = {
  ...
  requestAdServer: slots => {
    googletag.pubads().refresh(slots);
  },
  ...
};
```
