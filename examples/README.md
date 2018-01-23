# Examples

Integration examples are provided for reference.

Note: The Prebid example will not display the proper ad if you are opening the file locally. This is most likely due to how Prebid's DFP account for their test code is set up. Copy the example into a jsfiddle to see the real ad.

Common Pitfalls:
* Ensure that external scripts are included in the HTML. For example, the GPT library should be loaded in the head of the document. Many libraries will provide a global command queue to enqueue callbacks to run when they are loaded successfully.
* Ensure that when defining init(cb), the callback cb is called in an enqueued function to inform the Ads Manager API that the service is ready.
* Ensure that API calls which interact with DOM elements are run after such elements are loaded. The easiest way to do this is to load the script synchronously before the end of the body tag, after the elements it depends on have been loaded. Alternatively, set-up code can be run in the head of the document, with each ad div containing an inline script to requestAds. This will request the ad as each ad div finishes loading.
