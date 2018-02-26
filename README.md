
**WARNING: These libraries are under development and only availiable to selected Sortable customers.**

## Sortable Ads Manager

The ads manager is a utility library that a publisher can embed on a page to help manage multiple header bidder frameworks on the same page.

The main goals of this library are to:

1. Provide an API that separates the concerns of initializing and configuring various HB solutions, mapping ads to DOM elements, making requests, and rendering ads.
2. Be general enough so as to make it easy to integrate an HB into the framework, yet have its lifecycle explicitly defined and managed by the framework.
3. Play nice with SPA frameworks such as React. The ad lifecycle should be divided into several states that make it easy to integrate with Virtual DOM / Component lifecycle such as in React.

In short, this library will handle the administrative work of managing the life cycle of your ad units, so that requests are made properly.

We have also provided an example of using the Ad Manager API in a React component [here](https://github.com/sortable/react).

### Usage (For consumers)

Detailed guide, API reference and examples are available at [https://dev.sortable.com/ads](https://dev.sortable.com/ads).

### Build (For contributors)

NOTE: As the project is in its early stages, we are not accepting PRs at the moment. However, you are welcome to open issues or feature requests.

To build, you must have NodeJS and NPM installed on your environment.

First, run `npm install` to install all the required dependencies.

Afterwards, the available commands to run are:

* `npm run clean` - clean distributable artifacts
* `npm run build` - build distributable artifacts
* `npm run serve` - build and serve from root folder at localhost:9000/
* `npm run test` - run tests with MochaJS
* `npm run docs` - serve docs locally at localhost:3000

### License

MIT
