# Quick Start for React

---

!> This guide is only availiable for selected Sortable's customer at the moment.

## Installation

> * Run `npm install @sortable/ads-react --save` to install ads manager's React package.
> * Add Sortable provided CDN link to HTML page.

```html
<html>
  <head>
    <!-- NOTE: replace following link with Sortable provided CDN link -->
    <script async src="//tags-cdn.deployads.com/a/sortable-demo-only.com.js"></script>
  </head>
</html>
```

## Configuration

> * **Step 1**: load plugins
> * **Step 2**: define ads
> * **Step 3**: start serving ads

```js
import { sortableads } from '@sortable/ads-react';

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

## Request Ads by Rendering Ad Component

> * Use `Ad` or `TimeRefreshAd` component to load ad.
> * If only ad server plugin is used, it will send request to
> ad server immediately.
> * If both header bidder and ad server plugin are used, it will send request for
> header bidding, wait all responses and then send request to ad server.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Ad } from '@sortable/ads-react';

class App extends React.Component {
  render() {
    return (
      <Ad id="div-id-1" />
    );
  }
}

ReactDom.render(<App />, document.getElementById('root'));
```

## Basic Example

> * Use GPT plugin
> * No refresh

[](//jsfiddle.net/vqv8r7np/118/embedded/js,html,result/ ':include :type=iframe width=100% height=700 allowpaymentrequest allowfullscreen frameborder=0')

## Time Refresh Example

> * Use GPT Plugin
> * Use Prebid Plugin
> * Refresh every 30 seconds

[](//jsfiddle.net/vqv8r7np/143/embedded/js,html,result/ ':include :type=iframe width=100% height=700 allowpaymentrequest allowfullscreen frameborder=0')

## User Interaction Refresh Example

> * Use GPT Plugin
> * Use Prebid Plugin
> * Refresh by clicking button

[](//jsfiddle.net/vqv8r7np/139/embedded/js,html,result/ ':include :type=iframe width=100% height=700 allowpaymentrequest allowfullscreen frameborder=0')

## Webpack Example

Check out [HERE](https://github.com/sortable/ads-react/tree/master/example) for a full example using Webpack.
