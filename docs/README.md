
# Sortable Ads Manager

---

## Motivation

AdOp has never been easy. Publishers today often need to integrate with multiple libraries and frameworks for serving ads on page. Publishers not only have to spend time and resources on implementation of these frameworks and libraries, but also need to solve following problems:


* How to use multiple libraries and frameworks on the same page without interfering each other
* How to optimize usage of these libraries and frameworks
* How to effectively manage existing libraries and frameworks
* How to conveniently add additional libraries and frameworks on page

For publishers that are using or want to use Single Page Application (SPA) framework on their pages, it is hard to find a support library that is up to date and well maintained. Most likely publishers would have to build their SPA support library from scratch.

In order to help publishers solve problems and return the power to publishers, Sortable built Ads Manager which is a utility library that makes ads integration easy.

## Solution

In short, Ads Manager will handle the administrative work of managing the lifecycle of publishers’ ad units, so that requests are made properly. Sortable Ads Manager supports multiple libraries and frameworks of ad serving running in parallel on the same page in an optimized way. Moreover, Ads Manager has first-class [React](https://reactjs.org/) (a widely used SPA framework) support which allows publishers to use React as a simple plug-in library. Ads Manager is also designed to be SPA friendly for other SPA frameworks like [Angular](https://angular.io/).

## Use Cases

* The publisher is using a very basic setup, and would like to try Sortable API v2.0. It will be easier for them to migrate to Ads Manager with a standard setup and it will set them up to be scalable with more bidders in the future. Migration to Ads Manager will also probably be recommended for use with Cactus once it becomes standalone.

* The publisher is using GPT + Prebid and would like to add another customized header bidding solution without interfering with their workflow. We will handle the complexity of managing the google slots and timing for bid requests.

* The publisher wants to use the same header bidders on a new site or migration with SPA framework. They need to sync the ad lifecycle with the React component lifecycle themselves, or they can use our utility library which does this for them.

* The publisher wants to use the same header bidders, but a different ad server, or vice versa. Plugin system will make it easier for them to reuse HB and Ad server implementations.

* The publisher wants to use their same setup on multiple sites, with minimal configuration. Configuration with Ads Manager is declarative, so they can declare the properties they want to set for their ad units on each site, and the behaviour will be the same.

## License

It's [MIT](https://github.com/sortable/ads/blob/master/LICENSE) lol.
