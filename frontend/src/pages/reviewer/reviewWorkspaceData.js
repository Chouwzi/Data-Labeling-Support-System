export const normalizeReviewQueueResponse = (response) => {
  const data = response?.data?.result?.data || response?.data?.result || [];
  return Array.isArray(data) ? data : [];
};

export const loadReviewQueueForWorkspace = async ({ getReviewQueueImages, projectId }) => {
  const response = await getReviewQueueImages(projectId);
  return normalizeReviewQueueResponse(response);
};
