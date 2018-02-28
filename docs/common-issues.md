# Commen Issues

---

## Missing External Scripts

!> Ensure that any required external scripts are included in the HTML. For example the GPT library should be loaded in the head of the document. Many libraries will provide a global command queue to enqueue callbacks to run when they are loaded successfully.

```html
<html>
  <head>
    <!-- Make sure you include GPT before using GPT Plugin ! -->
    <script async src="https://www.googletagservices.com/tag/js/gpt.js"><script>
  </head>
</html>
```

## Using API Before Ready

!> Ensure API calls are wrapped by `sortableads.push` to wait until API is ready to use.

```html
<html>
  <head>
    <script async src="//tags-cdn.deployads.com/a/sortable-demo-only.com.js"></script>
    <script> var sortableads = sortableads || []; </script>

    <script>
      // BAD: API may not be ready
      sortableads.set('bidderTimeout', 1000);

      // GOOD: this will queue command until API is ready
      sortableads.push(function () {
        sortableads.set('bidderTimeout', 1000);
      });
    </script>
  </head>
</html>
```
