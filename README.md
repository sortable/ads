
**WARNING: These libraries are under development and only availiable to selected Sortable customers.**

## Sortable Ads

This repo contains libraries, examples and documentation for publishers integrating the Sortable ad framework into their sites.

## Ad Manager

The ad manager is a utility library that a publisher can embed on a page to help manage multiple header bidder frameworks on the same page.

The main goals of this library are to:

1. Provide an API that separates the concerns of initializing and configuring various HB solutions, mapping ads to DOM elements, making requests, and rendering ads.
2. Be general enough so as to make it easy to integrate an HB into the framework, yet have its lifecycle explicitly defined and managed by the framework.
3. Play nice with SPA frameworks such as React. The ad lifecycle should be divided into several states that make it easy to integrate with Virtual DOM / Component lifecycle such as in React.

In short, this library will handle the administrative work of managing the life cycle of your ad units, so that requests are made properly.

We have also provided an example of using the Ad Manager API in a React component [here](https://github.com/sortable/react).

### Build (For contributors)

NOTE: As the project is in its early stages, we are not accepting PRs at the moment. However, you are welcome to open issues or feature requests.

To build, you must have NodeJS and NPM installed on your environment.

First, run `npm install` to install all the required dependencies.

Afterwards, the available commands to run are:

* `npm run clean` - clean distributable artifacts
* `npm run build` - build distributable artifacts
* `npm run serve` - build and serve from root folder at localhost:9000/
* `npm run test` - run tests with MochaJS

Examples will be hosted at localhost:9000/examples/*
HTML documentation will be hosted at localhost:9000/docs/

### Usage (For consumers)

NOTE: If you are already a Sortable customer, please consult with your account manager to find the best way to integrate with Ads Manager.

To consume this package as an [NPM](https://www.npmjs.com/package/@sortable/ads) module:

`npm install @sortable/ads --save`

Then, using a module loader that supports either CommonJS or ES2015 modules, such as [webpack](https://webpack.js.org/):

```javascript
// Using ES6 transpiler
import '@sortable/ads';

// Not using ES6 transpiler
require('@sortable/ads');

// use the API via global variable
sortableads.method
...
```

Note that unlike most NPM modules that expose functionality, this module simply instantiates a global variable **sortableads** and populates it with the public API calls.

For easy **testing**, you can also consume the library by including the JavaScript bundle as provided by a CDN:

`<script src="https://cdn.jsdelivr.net/npm/@sortable/ads@x.x.x/dist/sortableads.min.js" async/>`

where x.x.x can be changed to whichever version of the API you wish to use. However, note that this link should **NOT** be used in production. You can download the Ads Manager script and serve it from your web hosting server.

Note that if you are loading the script asynchronously, you should include the following script and define sortableads before you use it:

`<script> var sortableads = sortableads || [];  </script>`

In the asynchronous use case, wrap all API calls in a callback, and add it to the sortableads queue:

```javascript
sortableads.push(() => {
  sortableads.method
  ...
});
```

## Example Integrations

The [examples](/examples) directory contains some example integrations using the Ad Manager.
