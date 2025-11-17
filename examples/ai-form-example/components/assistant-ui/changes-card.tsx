import { useLegitFs } from '@/lib/legit-runtime';
import { useAssistantState } from '@assistant-ui/react';
import { HistoryItem } from '@legit-sdk/core';
import { FC, useEffect, useState } from 'react';

const ChangesCard: FC = () => {
  const mainBranchLastCommitId = useAssistantState(
    ({ message }) => message.metadata?.custom?.depending_on_commit_id
  );
  const parentOperationId = useAssistantState(
    ({ message }) => message.parentId
  );
  const { legitFs } = useLegitFs();
  const threadId = 'main';
  const [comparisonCommitId, setComparisonCommitId] = useState<
    string | undefined
  >(undefined);
  const [diff, setDiff] = useState<DiffMap | undefined>(undefined);

  const getMainBranchCommitIdOfLatestChangingPrompt = (
    currentOperationId: string,
    // TODO: types for operationHistory
    operationHistory: Array<HistoryItem & { parentOids: string[] }>
  ): string | undefined => {
    // look at the operationHistory array for the operationId
    const operationHistoryItem = operationHistory.find(
      item => item.oid === currentOperationId
    );
    if (!operationHistoryItem) {
      return undefined;
    }
    // condition: look at the operationHistoryItem and check if has two parents
    if (operationHistoryItem.parentOids.length === 2) {
      // if so, return the operationId of the history item
      return operationHistoryItem.parentOids[1];
    } else {
      // if not recusively call the function with the operationId of the parentOids position 0
      return getMainBranchCommitIdOfLatestChangingPrompt(
        operationHistoryItem.parentOids[0],
        operationHistory
      );
    }
  };

  const logOperationHistory = async () => {
    try {
      const operationHistory = await legitFs.promises.readFile(
        `/.legit/branches/${threadId}/.legit/operationHistory`,
        'utf8'
      );
      if (!operationHistory) return;
      const operationHistoryParsed = JSON.parse(operationHistory);
      const comparisonCommitId = getMainBranchCommitIdOfLatestChangingPrompt(
        parentOperationId,
        operationHistoryParsed
      );
      setComparisonCommitId(comparisonCommitId);
    } catch (error) {
      console.info('Error reading operation history:', error);
    }
  };

  useEffect(() => {
    if (legitFs && !comparisonCommitId) {
      logOperationHistory();
    }
  }, [mainBranchLastCommitId]);

  const getPastState = async (commitId: string) => {
    const past = await legitFs.promises.readFile(
      `/.legit/commits/${commitId.slice(0, 2)}/${commitId.slice(2)}/form-values.json`,
      'utf8'
    );
    return past;
  };

  /**
   * Computes the difference between two JSON "form-state" objects.
   * This improved version:
   * - Also detects deleted keys.
   * - Avoids unnecessary parsing if no data.
   * - Handles both string and undefined/null values robustly.
   * - Uses clearer var names and type annotations.
   */
  type DiffEntry = {
    old: string;
    new: string;
    operation: 'new' | 'deleted' | 'changed';
  };
  type DiffMap = Record<string, DiffEntry>;

  const getDiff = async (
    id: string,
    pastId: string,
    ignoreKeys: string[] = []
  ) => {
    const [currentRaw, pastRaw] = await Promise.all([
      getPastState(id),
      getPastState(pastId),
    ]);
    if (!currentRaw && !pastRaw) return {};

    const currentState = currentRaw ? JSON.parse(currentRaw) : {};
    const pastState = pastRaw ? JSON.parse(pastRaw) : {};

    const keys = new Set([
      ...Object.keys(currentState),
      ...Object.keys(pastState),
    ]);
    const diff: DiffMap = {};

    for (const key of keys) {
      const curVal = currentState[key];
      const prevVal = pastState[key];
      if (ignoreKeys.includes(key)) continue;
      if (curVal !== prevVal) {
        if (prevVal === null || prevVal === undefined || prevVal === '') {
          diff[key] = { old: '', new: curVal, operation: 'new' };
        } else if (curVal === null || curVal === undefined || curVal === '') {
          diff[key] = { old: prevVal, new: '', operation: 'deleted' };
        } else {
          diff[key] = { old: prevVal, new: curVal, operation: 'changed' };
        }
      }
    }
    setDiff(diff);
  };

  useEffect(() => {
    if (comparisonCommitId && mainBranchLastCommitId) {
      // get the both states of the commits
      getDiff(mainBranchLastCommitId as string, comparisonCommitId, ['hidden']);
    }
  }, [comparisonCommitId, mainBranchLastCommitId]);

  if (!diff) return null;
  return (
    <div className="border border-gray-200 rounded-lg my-3 mr-12">
      <h2 className="flex h-12 items-center px-3 gap-2 border-b border-gray-200 font-medium">
        <span className="text-md bg-gray-200 px-2 rounded">
          {`${Object.entries(diff).length}`}
        </span>
        Changes
      </h2>
      {Object.entries(diff).map(([key, value]) => {
        const color =
          value.operation === 'new'
            ? 'text-green-500'
            : value.operation === 'deleted'
              ? 'text-red-500'
              : 'text-blue-500';
        const bgColor =
          value.operation === 'new'
            ? 'bg-green-100'
            : value.operation === 'deleted'
              ? 'bg-red-100'
              : 'bg-blue-100';
        return (
          <div key={key} className="px-3 py-2 flex gap-2">
            <h3 className={`${color} ${bgColor} px-2 rounded w-fit h-fit`}>
              {key}
            </h3>
            {value.old.length === 0 ? (
              <i className="text-gray-400">Empty</i>
            ) : (
              value.old
            )}
            <span className="text-gray-400">→</span>
            {value.new.length === 0 ? (
              <i className="text-gray-400">Empty</i>
            ) : (
              value.new
            )}
          </div>
        );
      })}
    </div>
  );
};

export { ChangesCard };
