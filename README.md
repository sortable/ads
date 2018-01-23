
**WARNING: These libraries are under development and only availiable to select Sortable customers**

# Sortable Ads

This repo contains libraries, examples and documentation for publishers integrating the Sortable ad framework into their sites.

## Ad Manager

The ad manager is a utility library that a publisher can embed on a page to help manage multiple header bidder frameworks on the same page.

### Build

To build, you must have NodeJS and NPM installed on your environment.

1. `npm install`
2. `npm run start`

Examples will be hosted at localhost:9000/examples/*

### Example Integrations

The [examples](/examples) directory contains some example integrations using the Ad Manager.

## Sortable Container API

The [src/deployads.ts](/src/deployads.ts) documents the Sortable container API. Although it's recommended to use this API in combination with the ad manager, it's provided for reference.
