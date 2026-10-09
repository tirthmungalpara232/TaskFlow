const Message = require('../models/Message');
const Project = require('../models/Project');
const { hasAccess } = require('./projectController');

// Same pattern as taskController.loadAccessibleProject — 404s (not 403) if
// the user isn't the owner or a member, so we don't leak project existence.
const loadAccessibleProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project || !hasAccess(project, userId)) return null;
  return project;
};

// @route GET /api/projects/:projectId/chat/group
const getGroupMessages = async (req, res, next) => {
  try {
    const project = await loadAccessibleProject(req.params.projectId, req.user._id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { before, limit = 50 } = req.query;
    const filter = { project: project._id, receiver: null };
    if (before) filter.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'name username avatar')
      .lean();

    res.json(messages.reverse());
  } catch (error) {
    next(error);
  }
};

// @route POST /api/projects/:projectId/chat/group  body: { content }
const sendGroupMessage = async (req, res, next) => {
  try {
    const project = await loadAccessibleProject(req.params.projectId, req.user._id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const message = await Message.create({
      project: project._id,
      sender: req.user._id,
      receiver: null,
      content: content.trim(),
    });
    await message.populate('sender', 'name username avatar');

    // Broadcast to everyone currently viewing this project's chat (see socket/chat.js)
    req.io?.to(`project:${project._id}`).emit('group-message', message);

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/projects/:projectId/chat/conversations
// Powers the "who can I DM" list on the chat sidebar — every other member
// of the project, owner flagged first.
const getConversations = async (req, res, next) => {
  try {
    const project = await loadAccessibleProject(req.params.projectId, req.user._id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await project.populate('user', 'name username avatar');
    await project.populate('members', 'name username avatar');

    const uid = req.user._id.toString();
    const people = [project.user, ...project.members]
      .filter((u) => u && u._id.toString() !== uid)
      .map((u) => ({ ...u.toObject(), isOwner: u._id.toString() === project.user._id.toString() }))
      .sort((a, b) => Number(b.isOwner) - Number(a.isOwner));

    res.json(people);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/projects/:projectId/chat/direct/:otherUserId
// The $or clause is what actually keeps this private: this query can only
// ever match rows where the requester is the sender or the receiver — even
// the project owner can't pull up a DM they aren't part of.
const getDirectMessages = async (req, res, next) => {
  try {
    const project = await loadAccessibleProject(req.params.projectId, req.user._id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const uid = req.user._id.toString();
    const { otherUserId } = req.params;
    const { before, limit = 50 } = req.query;

    const filter = {
      project: project._id,
      $or: [
        { sender: uid, receiver: otherUserId },
        { sender: otherUserId, receiver: uid },
      ],
    };
    if (before) filter.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'name username avatar')
      .populate('receiver', 'name username avatar')
      .lean();

    res.json(messages.reverse());
  } catch (error) {
    next(error);
  }
};

// @route POST /api/projects/:projectId/chat/direct/:otherUserId  body: { content }
const sendDirectMessage = async (req, res, next) => {
  try {
    const project = await loadAccessibleProject(req.params.projectId, req.user._id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const uid = req.user._id.toString();
    const { otherUserId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    if (otherUserId === uid) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }
    if (!hasAccess(project, otherUserId)) {
      return res.status(404).json({ message: 'That person is not part of this project' });
    }

    const message = await Message.create({
      project: project._id,
      sender: uid,
      receiver: otherUserId,
      content: content.trim(),
    });
    await message.populate('sender', 'name username avatar');
    await message.populate('receiver', 'name username avatar');

    // Deterministic private room shared only by these two users on this project
    const pair = [uid, otherUserId].sort().join(':');
    req.io?.to(`dm:${project._id}:${pair}`).emit('direct-message', message);

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroupMessages,
  sendGroupMessage,
  getConversations,
  getDirectMessages,
  sendDirectMessage,
};
