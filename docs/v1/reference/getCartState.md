---
title: getCartState()
layout: page
---

# getCartState()
The `getCartState` function returns the current [State object](/v1/reference/state/).

```html
<script type="module">
  import { getCartState } from {% include code/last-release-file-name.html asset_url=true %}

  const state = getCartState();
  console.log(state);
</script>
```
