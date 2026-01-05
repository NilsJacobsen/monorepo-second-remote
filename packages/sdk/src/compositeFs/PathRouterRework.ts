/**
 * Routes filesystem paths to appropriate SubFS handlers using a pattern-based system.
 *
 * The PathRouter supports a flexible pattern syntax for defining dynamic routes:
 *
 * | Pattern        | Description          | Example           | Matches                                              |
 * |----------------|----------------------|-------------------|------------------------------------------------------|
 * | `static`       | Static segment       | `branches`        | `branches` only                                      |
 * | `[param]`      | Dynamic segment      | `[branchName]`    | `main`, `dev`, etc. (single segment)                 |
 * | `[...param]`   | Catch-all rest       | `[...filePath]`   | `path/to/file.txt` (multiple segments)               |
 * | `[[param]]`    | Optional segment     | `[[branchName]]`  | matches zero or one occurrence of the segment        |
 * | `[[...param]]` | Optional catch-all   | `[[...filePath]]` | matches zero or more segments                        |
 * | `.`            | Folder root handler  | `{ '.': handler }`| handles the folder itself                            |
 *
 * Priority is given to more specific routes (static > dynamic > catch-all).
 *
 *
 * @example
 * ```typescript
 * const router = new PathRouter({
 *   '[[...filePath]]': catchAllHHandler,
 *   'branches': {
 *     '[branchName]': {
 *       '.legit': legitFolderHanlder,
 *       '[...filePath]': branchFileHandler
 *     }
 *   }
 * }, '/root');
 *
 * console.log(router.match('/root/branches/main/src/index.ts'));
 * // {
 * //   handler: branchFileHandler,
 * //   params: { branchName: 'main', filePath: 'src/index.ts' },
 * //   staticSiblings: [ { segment: '.legit', type: 'folder' } ]
 * // }
 *
 * console.log(router.match('/root/branches/main/.legit/config'));
 * // {
 * //   handler: legitFolderHanlder,
 * //   params: { branchName: 'main' },
 * //   staticSiblings: [ ]
 * // }
 *
 * console.log(router.match('/root/other/path/file.txt'));
 * // {
 * //   handler: catchAllHHandler,
 * //   params: { filePath: 'other/path/file.txt' },
 * //   staticSiblings: [ {segment: 'branches', type: 'folder'} ]
 * // }
 *
 * ```
 */
import { CompositeSubFs } from './CompositeSubFs.js';
import { BaseCompositeSubFs } from './subsystems/BaseCompositeSubFs.js';
export type LegitRouteNode = {
  handler?: CompositeSubFs;
  children?: Record<string, LegitRouteNode>;
};

/**
 * Context information for filesystem operations
 * This context is provided by CompositeFs when routing to a specific SubFS
 */
export interface FsOperationContext {
  /** The full original path that was requested */
  fullPath: string;

  /** Extracted route parameters (e.g., { branchName: 'main', filePath: 'path/to/file' }) */
  params: Record<string, string>;

  /** Static siblings present at the matched route */
  staticSiblings: { segment: string; type: 'folder' | 'file' }[];
}

export type MatchResult = {
  handler: CompositeSubFs;
  staticSiblings: { segment: string; type: 'folder' | 'file' }[];
  params: Record<string, string>;
};

export interface LegitRouteFolder {
  [key: string]: PathRouteDescription;
}

type PathRouteDescription = CompositeSubFs | LegitRouteFolder;

/**
 *
 */
export class PathRouter {
  public compiledRoutes: {
    regex: RegExp;
    paramNames: string[];
    staticSiblings: { segment: string; type: 'folder' | 'file' }[];
    handler: CompositeSubFs;
  }[];

  constructor(
    public routes: LegitRouteFolder,
    private rootPath: string
  ) {
    const staticSiblings: Record<
      string,
      { segment: string; type: 'folder' | 'file' }[]
    > = {};

    // Flatten tree into route patterns
    const flatRoutes: {
      path: string;
      handler: CompositeSubFs;
      basePath: string;
    }[] = [];
    const walk = (node: PathRouteDescription, path: string) => {
      
      if (typeof node.name === 'string') {
        flatRoutes.push({
          path,
          handler: node as CompositeSubFs,
          basePath: path,
        });
      } else {
        
        let currentSegmentParameter: string | null = null;

        const wildcarChildrenMatcher = Object.keys(node).filter(
          k => k === '.' || k.startsWith('[[')
        );
        if (wildcarChildrenMatcher.length > 1) {
          throw new Error(
            `Multiple matcher for path segment '${path}'. ${wildcarChildrenMatcher.join(', ')}`
          );
        }

        // its a folder
        for (const [segment, child] of Object.entries(node)) {
          if (segment === '.') {
            // folder root definition
            if (typeof child.name !== 'string') {
              throw new Error(
                `. at path '${path}' cannot have further sub-routes.`
              );
            }

            flatRoutes.push({
              path,
              handler: child as CompositeSubFs,
              basePath: path,
            });
          } else if (segment.startsWith('[[') && segment.endsWith(']]')) {
            if (currentSegmentParameter) {
              throw new Error(
                `Conflict: multiple dynamic parameters at the same path segment '${path}'. ${currentSegmentParameter} and ${segment}`
              );
            }
            currentSegmentParameter = segment;

            if (segment.startsWith('[[...')) {
              if (typeof child.name !== 'string') {
                throw new Error(
                  `Conflict: catch-all optional '[[...parameter_name]]' at path '${path}' cannot have further sub-routes.`
                );
              }

              // no need to further walk
              flatRoutes.push({
                path: path ? `${path}/${segment}` : segment,
                handler: child as CompositeSubFs,
                basePath: path,
              });
            } else {
              walk(child, path ? `${path}/${segment}` : segment);
            }
          } else if (segment.startsWith('[') && segment.endsWith(']')) {
            if (currentSegmentParameter) {
              throw new Error(
                `Conflict: multiple dynamic parameters at the same path segment '${path}'. ${currentSegmentParameter} and ${segment}`
              );
            }
            currentSegmentParameter = segment;
            if (segment.startsWith('[...')) {
              if (typeof child.name !== 'string') {
                throw new Error(
                  `Conflict: catch-all optional '[[...parameter_name]]' at path '${path}' cannot have further sub-routes.`
                );
              }
              // no need to further walk
              flatRoutes.push({
                path: path ? `${path}/${segment}` : segment,
                basePath: path,
                handler: child as CompositeSubFs,
              });
            } else {
              walk(child, path ? `${path}/${segment}` : segment);
            }
          } else {
            // only non dynamic segments are added as static siblings

            staticSiblings[path] = staticSiblings[path] || [];

            const siblingSubDefinitions = Object.keys(child);

            let isFolder = false;

            if (siblingSubDefinitions.length > 1) {
              // more than two - folder for sure
              isFolder = true;
            } else {
              const firstSubSibling = child[siblingSubDefinitions[0]!];
              if (
                firstSubSibling === 'string' &&
                firstSubSibling instanceof BaseCompositeSubFs
              ) {
                if (firstSubSibling.readdir !== undefined) {
                  isFolder = true;
                }
              }
            }

            staticSiblings[path].push({
              segment,
              type: isFolder ? 'folder' : 'file',
            });
            walk(child, path ? `${path}/${segment}` : segment);
          }
        }
      }
    };

    walk(routes, '');

    function segmentScore(seg: string): number {
      if (seg === '.' || seg === '') return 0;
      if (seg.startsWith('[[...')) return 1;
      if (seg.startsWith('[[')) return 2;
      if (seg.startsWith('[')) return 3;
      return 4 * 256 + Math.min(seg.length, 255);
    }

    function pathPriority(path: string, maxSegments = 10): number {
      const segments = path.split('/').filter(Boolean);
      let score = 0;

      for (let i = 0; i < segments.length; i++) {
        const segScore = segmentScore(segments[i]!);
        score += segScore * Math.pow(1000, maxSegments - i);
      }

      return score + segments.length;
    }

    const routesByPriority = flatRoutes.sort(
      (a, b) => pathPriority(b.path) - pathPriority(a.path)
    );

    // Compile route patterns to regex and param extractors
    this.compiledRoutes = routesByPriority.map(
      ({ path: pattern, handler, basePath }) => {
        const paramNames: string[] = [];
        const segments = pattern.split('/');

        // valid:
        //
        // [[...filepath]] <-- catch all
        // .legit       <-- static higher priotry

        // invalid: (doesnt make sense -> use static subfolder instead)
        // [branchName] <- this would override catch all for single segment only - usecase undclear
        // [[...filepath]] <-- catch all
        // .legit       <-- static higher priotry

        // valid: (doesnt make sense -> use static subfolder instead)
        //  <- this would override catch all for single segment only - usecase undclear
        // .legit/branches/[branhName]/[[...filepath]]       <-- static higher priotry

        // subsequent single segements - make sense
        // multisegment doesnt make sense

        // .legit/[branchName]/[...path]/[filename].docx < -. backward lookup?
        // .legit/[branchName]/[...path]/.legit/version  <- would be needed to provide a legit folder in every subdirectory

        // [slug] <- branchName
        // [[...slug]] <- filepath in branch

        // [[slug]] <- optional usecase?
        // [...slug] <- usecase?

        // /test
        // /test/.
        // /test/[lessPrecise]
        // /test/[lessPrecise]/precise2
        // /test/precise
        // /test/precise/[[...catchall]]
        // /test/precise/precise

        // count segments (higher -> higher priortiy times precision level static > dynamic > catchall)

        // Build regex for each segment type
        const regexSegments = segments.map(segment => {
          if (segment.startsWith('[[') && segment.endsWith(']]')) {
            // Optional parameter: [[param]] or [[...param]]
            const name = segment.slice(2, -2).replace(/^\.\.\./, '');
            paramNames.push(name);

            if (segment.startsWith('[[...')) {
              // [[...param]] - zero or more segments
              // This will be handled specially after the main regex
              return '(.*)'; // Marker for post-processing
            } else {
              throw new Error(
                'Optional single-segment parameters [[param]] are not supported atm. usecase?'
              );
            }
          } else if (segment.startsWith('[') && segment.endsWith(']')) {
            // Optional parameter: [param] or [...param]
            if (segment.startsWith('[...')) {
              throw new Error(
                'Multisegment catch-all parameters [...param] are not supported atm. usecase?'
              );
            } else {
              // [param] - exactly one segment
              const name = segment.slice(1, -1);
              paramNames.push(name);
              return '/([^\/]+)';
            }
          }

          // escape regex special chars in static segments
          return '/' + segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        });

        // Simple case: no catch-all patterns
        const regexStr = '^' + regexSegments.join('') + '$';
        const regex = new RegExp(regexStr);

        return {
          regex,
          paramNames,
          basePath,
          staticSiblings: staticSiblings[basePath] ?? [],
          handler: handler,
        };
      }
    );
  }

  match(path: string): MatchResult | undefined {
    let relative = path;

    // Remove the root path prefix if present
    if (relative.startsWith(this.rootPath + '/')) {
      relative = relative.slice(this.rootPath.length + 1);
    } else if (relative.startsWith(this.rootPath)) {
      relative = relative.slice(this.rootPath.length);
    }

    relative = '/' + relative; // Ensure leading slash for matching

    // Get parent path or undefined
    const lastSlashIndex = relative.lastIndexOf('/');
    const parentPath =
      lastSlashIndex > 0 ? relative.slice(0, lastSlashIndex) : '';

    for (const { regex, paramNames, handler, staticSiblings, basePath } of this
      .compiledRoutes) {
      const match = relative.match(regex);
      if (!match) continue;
      const params: Record<string, string> = {};

      let siblings: typeof staticSiblings = [];

      if (parentPath === basePath) {
        // TODO do regex matching here as well
        siblings = staticSiblings;
      }

      // Extract parameters, handling optional segments properly
      for (let i = 0; i < paramNames.length; i++) {
        let value = match[i + 1] || '';

        // Remove leading slash from optional parameters if present
        if (value.startsWith('/')) {
          value = value.slice(1);
        }

        params[paramNames[i]!] = decodeURIComponent(value);
      }
      return { handler, params, staticSiblings: siblings };
    }
    return;
  }
}
