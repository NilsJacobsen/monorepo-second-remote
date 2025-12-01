---
'@legit-sdk/react': minor
---

`Refactored @legit-sdk/react based on @legit-sdk/core changes

- Remove `initLegitFs` and replace it with a general `openLegitFs` initializer
- Add a `rollback` function to the `useLegitContext` hook return
- Add a config parameter to the `LegitProvider` let's you configure sync functionality
- Rename `content` and `setContent` to `data` and `setData` in `useLegitFile` return
