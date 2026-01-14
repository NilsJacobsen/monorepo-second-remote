---
'@legit-sdk/core': minor
---

New Features

- Archive & Restore Functionality
  - Added saveArchive() method - Creates a compressed portable archive of the entire Legit repository (.git folder)
    - Recursively captures all Git objects, refs, and configuration
    - Encodes binary content as base64 in a JSON manifest
    - Compresses output using pako.deflate() for efficient storage and transfer
    - Returns Uint8Array suitable for file storage or network transmission
  - Added loadArchive() method - Restores a Legit repository from a previously created archive
    - Decompresses and parses the archive manifest
    - Intelligently handles Git references to prevent data loss: - New refs → Added directly to repository
      - Fast-forwardable refs → Updated to new commit
      - Conflicting refs → Created as {branch}-conflict-{uuid} to preserve both versions
    - Skips config files to avoid overriding user-specific settings
    - Safely merges archive data with existing repository state
- Use Cases
  - Backup & Restore: Complete repository snapshots for disaster recovery
  - Repository Sharing: Transfer repositories between systems without network sync
  - Offline Distribution: Bundle repositories with applications or documentation
  - State Preservation: Save and restore repository state at specific points in time
