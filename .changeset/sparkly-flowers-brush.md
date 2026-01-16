---
'@legit-sdk/core': minor
---

**Archive loading enhancements:**

- Added a `clearExisting` option to the `loadArchive` method in `openLegitFs`, allowing the entire `.git` folder to be cleared before loading an archive. This ensures that loading an archive can fully replace the repository state if desired.
- Updated the archive loading logic to accept a parameter object instead of a bare archive, and modified all relevant tests to use the new API.
- Added a comprehensive test verifying that `loadArchive` with `clearExisting: true` fully replaces the repository, removing all prior refs and content.

**Git branch and ref resolution improvements:**

- Refactored branch and ref resolution in Git virtual file adapters to use a new `tryResolveRef` utility, reducing duplicated error handling and improving robustness when resolving refs
- Improved error messages and logic when operation branches or base branches do not exist, making failures clearer and easier to debug.

**Code quality and bug fixes:**

- Fixed a bug in `PathRouter` where route parameters were incorrectly decoded, which could cause issues with certain URL patterns.
- Added a guard in `CompositeSubFsAdapter` to handle cases where `storageFs` is not defined, preventing runtime errors for non-Git adapters.
- Simplified the branches list adapter to avoid unnecessary async calls when listing branch directories.
- Minor code cleanups and whitespace fixes in Git virtual file adapters.

These changes collectively improve reliability, test coverage, and maintainability of the composite filesystem's Git integration.
