# Examples

The sub-projects in this directory shows how to use ads-manager as an ES6 module with webpack,
a popular module loader.

# Build

The build steps are the same for each project.

1. `npm install`
2. `npm run start`
3. Open localhost:9000/index.html in your browser of choice.

Places to check when things go wrong:
* Ensure that the GPT library is loaded in the head of the document. The API will only run enqueued calls once it determines that GPT has been successfully initialized.
* Ensure that when defining init(cb), the callback cb is called in an enqueued GPT function to inform the API that GPT is ready.
* Ensure that API calls which interact with DOM elements are run after such elements are loaded. The easiest way to do this is to load the script synchronously before the end of the body tag, after the elements it depends on have been loaded. Alternatively, set-up code can be performed asynchronously in the head of the document, with API calls being pushed into a command queue synchronously as each element finishes loading (NOTE: don't currently support this, would be more fluid loading).
