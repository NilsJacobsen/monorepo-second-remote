/**
 * Context information for filesystem operations
 * This context is provided by CompositeFs when routing to a specific SubFS
 */
export interface FsOperationContext {
  /** The full original path that was requested */
  fullPath: string;

  /** Extracted route parameters (e.g., { branchName: 'main', filePath: 'path/to/file' }) */
  params: Record<string, string>;

  /** Static siblings from route matching */
  staticSiblings: { segment: string; type: 'folder' | 'file' }[];
}
