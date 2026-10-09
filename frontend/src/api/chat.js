import api from './axios';

export const getGroupMessages = (projectId) =>
  api.get(`/projects/${projectId}/chat/group`).then((r) => r.data);

export const sendGroupMessage = (projectId, content) =>
  api.post(`/projects/${projectId}/chat/group`, { content }).then((r) => r.data);

export const getConversations = (projectId) =>
  api.get(`/projects/${projectId}/chat/conversations`).then((r) => r.data);

export const getDirectMessages = (projectId, otherUserId) =>
  api.get(`/projects/${projectId}/chat/direct/${otherUserId}`).then((r) => r.data);

export const sendDirectMessage = (projectId, otherUserId, content) =>
  api.post(`/projects/${projectId}/chat/direct/${otherUserId}`, { content }).then((r) => r.data);
