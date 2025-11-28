import { vi } from 'vitest';

export const mockedLegitFs = {
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
  getCurrentBranch: vi.fn().mockResolvedValue('anonymous'),
};

export const mockOpenLegitFs = vi.fn().mockResolvedValue(mockedLegitFs);
