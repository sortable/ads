# React Support @sortable/ads-react

---

## `Ad`

Basic ad component to handle the lifetime of an ad. You can build more complex ad component based on this one.

```jsx
import { Ad } from '@sortable/ads-react';

// No refresh
<Ad elementId="div-abcd-1" />

// Refresh by `refreshKey`. It will refresh when a new `refreshKey` is given.
<Ad elementId="div-abcd-2" refreshKey={refreshKey} />
```

## `TimeRefreshAd`

Built on top of `Ad` component, it will do time refresh by itself.

```jsx
import { TimeRefreshAd } from '@sortable/ads-react';

// Refresh every 30 seconds
<TimeRefreshAd elementId="div-abcd-3" interval={30} />
```

## `sortableads`

Shortcut to import global `sortableads` variable.

```js
import { sortableads } from '@sortable/ads-react';

sortableads.push(function() {
  // run command here
});
```
