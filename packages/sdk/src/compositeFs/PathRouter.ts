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
  handler: BaseCompositeSubFs;
  staticSiblings: { segment: string; type: 'folder' | 'file' }[];
  params: Record<string, string>;
};

export interface LegitRouteFolder {
  [key: string]: PathRouteDescription;
}

type PathRouteDescription = CompositeSubFs | LegitRouteFolder;

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
    // Flatten tree into route patterns
    const flatRoutes: Record<
      string,
      {
        handler: CompositeSubFs;
        siblings: { segment: string; type: 'folder' | 'file' }[];
      }
    > = {};
    const walk = (node: PathRouteDescription, path: string) => {
      // TODO test for CompositeSubFs only property - we could use '/' since it is not valid within paths
      if (typeof node.name === 'string') {
        flatRoutes[path] = {
          handler: node as CompositeSubFs,
          siblings: [],
        };
        // its a VirtualFileDefinition
        const vFile = node as CompositeSubFs;
      } else {
        const siblings: { segment: string; type: 'folder' | 'file' }[] = [];

        // its a folder
        for (const [segment, child] of Object.entries(node)) {
          if (segment === '.') {
            // folder root definition
            if (flatRoutes[path]) {
              throw new Error(
                `Conflict: multiple handlers for path '${path}', '.' and optional '[[parameter_name]]' defined?`
              );
            }

            flatRoutes[path] = {
              handler: child as CompositeSubFs,
              siblings: siblings,
            };
          } else if (segment.startsWith('[[') && segment.endsWith(']]')) {
            // catch all dynamic - must not conflict with . static route
            if (flatRoutes[path]) {
              throw new Error(
                `Conflict: multiple handlers for path '${path}', '.' and optional '[[parameter_name]]' defined?`
              );
            }

            flatRoutes[path] = {
              handler: child as CompositeSubFs,
              siblings: siblings,
            };

            if (segment.startsWith('[[...')) {
              flatRoutes[path ? `${path}/${segment}` : segment] = {
                handler: child as CompositeSubFs,
                siblings: [],
              };
            } else {
              walk(child, path ? `${path}/${segment}` : segment);
            }
          } else if (segment.startsWith('[') && segment.endsWith(']')) {
            if (segment.startsWith('[...')) {
              // no need to further walk
              flatRoutes[path ? `${path}/${segment}` : segment] = {
                handler: child as CompositeSubFs,
                siblings: [],
              };
            } else {
              walk(child, path ? `${path}/${segment}` : segment);
            }
          } else {
            // only non dynamic segments are added as siblings
            siblings.push({ segment, type: child['.'] ? 'folder' : 'file' });
            walk(child, path ? `${path}/${segment}` : segment);
          }
        }
      }
    };

    walk(routes, '');

    // Compile route patterns to regex and param extractors
    this.compiledRoutes = Object.entries(flatRoutes).map(([pattern, entry]) => {
      const paramNames: string[] = [];
      const regexStr = pattern
        .split('/')
        .map(segment => {
          if (segment.startsWith('[[') && segment.endsWith(']]')) {
            const name = segment.slice(2, -2).replace(/^\.\.\./, '');
            paramNames.push(name);
            return '(.*)';
          }
          if (segment.startsWith('[') && segment.endsWith(']')) {
            const name = segment.slice(1, -1);
            paramNames.push(name);
            return '([^/]+)';
          }
          return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        })
        .join('/');
      const regex = new RegExp(`^${regexStr}$`);
      return {
        regex,
        paramNames,
        staticSiblings: entry.siblings,
        handler: entry.handler,
      };
    });
  }

  match(path: string): MatchResult | undefined {
    let relative = path;

    // Remove the root path prefix if present
    if (relative.startsWith(this.rootPath + '/')) {
      relative = relative.slice(this.rootPath.length + 1);
    } else if (relative.startsWith(this.rootPath)) {
      relative = relative.slice(this.rootPath.length);
    }

    for (const { regex, paramNames, handler, staticSiblings } of this
      .compiledRoutes) {
      const match = relative.match(regex);
      if (!match) continue;
      const params: Record<string, string> = {};
      for (let i = 0; i < paramNames.length; i++) {
        params[paramNames[i]!] = decodeURIComponent(match[i + 1] || '');
      }
      return { handler, params, staticSiblings };
    }
    return;
  }
}
