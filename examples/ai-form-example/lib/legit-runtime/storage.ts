import { initLegitFs } from '@legit-sdk/core';
import memfs from 'memfs';
import { LegitFsInstance } from './types';

let legitFsPromise: Promise<LegitFsInstance> | null = null;

export async function getLegitFs(): Promise<LegitFsInstance> {
  if (!legitFsPromise) {
    legitFsPromise = initLegitFs(
      memfs as unknown as typeof import('node:fs'),
      '/'
    );
    if (window) {
      (window as any).legitFs = await legitFsPromise;
    }
  }
  return legitFsPromise;
}

export const LEGIT_BRANCH_ROOT = '/.legit/branches';

// export async function ensureBranchStructure(threadId: string): Promise<void> {
//   const fs = await getLegitFs();
//   await fs.promises.mkdir(LEGIT_BRANCH_ROOT, { recursive: true });

//   const branchPath = `${LEGIT_BRANCH_ROOT}/${threadId}`;
//   try {
//     await fs.promises.mkdir(branchPath, { recursive: false });
//   } catch (error) {
//     if ((error as { code?: string }).code !== 'EEXIST') {
//       throw error;
//     }
//   }

//   const branchLegitPath = `${branchPath}/.legit`;
//   await fs.promises.mkdir(branchLegitPath, { recursive: true });
// }

export async function listBranches(): Promise<string[]> {
  const fs = await getLegitFs();
  try {
    const branches = await fs.promises.readdir(LEGIT_BRANCH_ROOT);
    return branches.filter(name => !name.startsWith('.'));
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      await fs.promises.mkdir(LEGIT_BRANCH_ROOT, { recursive: true });
      return [];
    }
    throw error;
  }
}

export async function readJson<T>(path: string, defaultValue: T): Promise<T> {
  const fs = await getLegitFs();
  try {
    const content = await fs.promises.readFile(path, 'utf8');
    return JSON.parse(content) as T;
  } catch (error) {
    // TODO: improve this error, it has no code
    if ((error as { message?: string }).message.includes('ENOENT')) {
      await writeJson(path, defaultValue);
      return defaultValue;
    }
    throw error;
  }
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  const fs = await getLegitFs();
  await fs.promises.writeFile(path, JSON.stringify(data), 'utf8');
}
