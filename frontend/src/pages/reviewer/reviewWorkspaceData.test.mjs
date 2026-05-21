import test from 'node:test';
import assert from 'node:assert/strict';

import { loadReviewQueueForWorkspace } from './reviewWorkspaceData.js';

test('loadReviewQueueForWorkspace always fetches fresh queue data for reopened tasks', async () => {
  const taskId = 'task-1';
  const responses = [
    [{ taskId, annotations: Array.from({ length: 5 }, (_, index) => ({ id: `old-${index}` })) }],
    [{ taskId, annotations: Array.from({ length: 9 }, (_, index) => ({ id: `new-${index}` })) }],
  ];
  let calls = 0;

  const getReviewQueueImages = async () => ({
    data: {
      result: {
        data: responses[calls++],
      },
    },
  });

  const firstLoad = await loadReviewQueueForWorkspace({ getReviewQueueImages });
  const secondLoad = await loadReviewQueueForWorkspace({ getReviewQueueImages });

  assert.equal(firstLoad[0].annotations.length, 5);
  assert.equal(secondLoad[0].annotations.length, 9);
  assert.equal(calls, 2);
});
