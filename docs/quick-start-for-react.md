# Quick Start for React

!> This guide is only availiable for selected Sortable's customer at the moment.

## Installation

> * Run `npm install @sortable/ads-react` to install ads manager's React package.
> * Add Sortable provided CDN link to HTML page.

```html
<html>
  <head>
    <!-- NOTE: replace following link with Sortable provided CDN link -->
    <script async src="//tags-cdn.deployads.com/a/sortable-demo-only.com.js"></script>
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

## Request Ads

> * Use `Ad` component to load ad.
> * If only ad server plugin is used, it will send request to
> ad server immediately.
> * If both header bidder and ad server plugin are used, it will send request for
> header bidding, wait all responses (or until it's timeout), and then send request to ad server.

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

## Full Example

Check out [HERE](https://github.com/sortable/ads-react/tree/master/example) for a full example using Webpack.

## Live Examples

#### Basic Example

[Basic Example](//jsfiddle.net/vqv8r7np/97/embedded/js,html,result/ ':include :type=iframe width=100% height=700 allowpaymentrequest allowfullscreen frameborder=0')
