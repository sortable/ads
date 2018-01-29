
**WARNING: These libraries are under development and only availiable to select Sortable customers.**

# Sortable Ads

This repo contains libraries, examples and documentation for publishers integrating the Sortable ad framework into their sites.

## Ad Manager

The ad manager is a utility library that a publisher can embed on a page to help manage multiple header bidder frameworks on the same page.

The main goals of this library are to:

1. Provide an API that separates the concerns of initializing and configuring various HB solutions, mapping ads to DOM elements, making requests, and rendering ads.
2. Be general enough so as to make it easy to integrate an HB into the framework, yet have its lifecycle explicitly defined and managed by the framework.
3. Play nice with SPA frameworks such as Angular or React. The ad lifecycle should be divided into several states that make it easy to integrate with Virtual DOM / Component lifecycle such as in React.

In short, this library will handle the administrative work of managing the life cycle of your ad units, so that requests are made properly.

### Build

To build, you must have NodeJS and NPM installed on your environment.

First, run `npm install` to install all the required dependencies.

Afterwards, the available commands to run are:

* `npm run clean` - clean distributable artifacts
* `npm run build` - build distributable artifacts
* `npm run docs` - generate docs in /docs
* `npm run serve` - serve from root folder at localhost:9000/
* `npm run test` - run tests with MochaJS

Examples will be hosted at localhost:9000/examples/*
HTML documentation will be hosted at localhost:9000/docs/

### Example Integrations

The [examples](/examples) directory contains some example integrations using the Ad Manager.

## Sortable Container API

The DeployAds API in [src/types.d.ts](/src/types.d.ts) documents the types for the Sortable container API. Although it's recommended to use this API in combination with the ad manager, it's provided for reference.
