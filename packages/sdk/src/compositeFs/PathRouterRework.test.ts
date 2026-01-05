import { describe, it, expect } from 'vitest';
import { PathRouter } from './PathRouter.js';
import { BaseCompositeSubFs } from './subsystems/BaseCompositeSubFs.js';

// Mock SubFS class for testing
class MockSubFs extends BaseCompositeSubFs {
  constructor(public override name: string) {
    super({ name, rootPath: '/test' });
  }

  override async responsible(_path: string): Promise<boolean> {
    return true;
  }

  override fileType(): number {
    return 999;
  }
}

describe('PathRouter', () => {
  describe('Legit Sample routes', () => {
    it('should match exact static path', () => {
      const router = new PathRouter(
        {
          // We define the catch all at the very top to enure prioritization works correctly
          '[[...filePath]]': {
            '.': new MockSubFs('[[...filePath]]'),
            // under each subfolder within a branch there should be a .legit folder too
            // NOTE static siblings of matching paths should get merged
            // here /root/.legit should cotain branches, commits, head but also changes
            // here /root/my_folder/.legit should cotain only changes
            // hiding in specific subfolder happens in prefilter logic of CompositeSubFs
            // -> this means we evaluate all regex against a path, use the one wiht the highest prio
            // -> but union the sstatic siblings of all matching routes
            '.legit': {
              changes: new MockSubFs('[[...filePath]]/.legit/changes'),
            },
          },
          // this should have a higher prio than [[...filePath]/.legit
          '.legit': {
            '.': new MockSubFs('.legit'),
            head: new MockSubFs('.legit/head'),
            branches: {
              '.': new MockSubFs('.legit/branches'),
              '[branchName]': {
                // branch names could include / so this is not a good delimiter here
                '.legit': {
                  '.': new MockSubFs('.legit/branches/[branchName]/.legit'),
                  head: new MockSubFs(
                    '.legit/branches/[branchName]/.legit/head'
                  ),
                },
                '[[...filePath]]': {
                  '.': new MockSubFs(
                    '.legit/branches/[branchName]/[[...filePath]]'
                  ),
                  // under each subfolder within a branch there should be a .legit folder too
                  '.legit': new MockSubFs(
                    '.legit/branches/[branchName]/[[...filePath]]/.legit'
                  ),
                },
              },
            },
            commits: {
              '.': new MockSubFs('.legit/commits'),
              '[sha_1_1_2]': {
                '.': new MockSubFs('.legit/commits/[sha_1_1_2]'),
                '[sha1_3__40]': {
                  '[[...filePath]]': new MockSubFs(
                    '.legit/commits/[sha_1_1_2]/[sha1_3__40]/[[...filePath]]'
                  ),
                },
              },
            },
          },
          '.claude': {
            '[[...filePath]]': new MockSubFs('.claude/[[...filePath]]'),
          },
        },

        '/root'
      );

      const result = router.match('/root/.legit/branches/main/src/index.ts');
      expect(result).toBeDefined();
      expect(result?.handler.name).toBe(
        '.legit/branches/[branchName]/[[...filePath]]'
      );
      expect(
        result?.params,
        'branch and filePath Parameter should be extracted from path'
      ).toEqual({
        branchName: 'main',
        filePath: 'src/index.ts',
      });

      const legitInRoot = router.match('/root/.legit');
      expect(legitInRoot).toBeDefined();
      expect(
        legitInRoot?.handler.name,
        'for the root the .legit folder since it has a higher priority'
      ).toBe('.legit');
      expect(
        legitInRoot?.staticSiblings,
        'the .legit folder in root should have static siblings'
      ).toEqual([
        { segment: 'commits', type: 'folder' },
        { segment: 'head', type: 'file' },
        { segment: 'branches', type: 'folder' },
      ]);

      const legitInSubfolder = router.match('/root/path/to/folder/.legit');
      expect(legitInSubfolder).toBeDefined();
      expect(legitInSubfolder?.handler.name).toBe('[[...filePath]]/.legit');
    });
  });
});
