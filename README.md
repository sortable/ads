
**WARNING: These libraries are under development and only availiable to select Sortable customers.**

# Sortable Ads

This repo contains libraries, examples and documentation for publishers integrating the Sortable ad framework into their sites.

## Ad Manager

The ad manager is a utility library that a publisher can embed on a page to help manage multiple header bidder frameworks on the same page.

It was written around GPT and DFP, so that multiple HB demand sources can compete to target DFP line items with a higher rate. The main issue with interacting with DFP is that if you are batching requests instead of using single request mode (which you should be doing to save on network latency), requesting an ad for an arbitrary ad slot will send a request for all the ad slots. There is no way to specify which ad slots you want to batch requests for. This is obviously undesirable, so you must ensure that you have set targeting on all ad units before making the request. This library will handles the administrative work of managing the life cycle of your ad units, so that requests are made properly.

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

The [src/deployads.ts](/src/deployads.ts) documents the Sortable container API. Although it's recommended to use this API in combination with the ad manager, it's provided for reference.
