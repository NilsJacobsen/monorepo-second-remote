---
'@legit-sdk/nfs-serve': minor
'@legit-sdk/core': minor
---

SDK Improvements

- Added withFileTypes option to readdir operations
- Enhanced virtual file system handling
- Improved debugging and logging capabilities
- Route configuration moved to legitfs core
- Branch namespacing: Complex branch names (branch/name.with.dot) are URL-encoded
- Current branch file system support via .legit/currentBranch
- Improved branch folder listing and navigation
- Enhanced compare and branch operations

NFS Server Enhancements

- Improved logging and main process integration
- Better server lifecycle management
- Enhanced stability for mount/unmount operations
