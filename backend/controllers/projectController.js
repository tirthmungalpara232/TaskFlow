const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// True if the user owns the project or is a member of its team
const hasAccess = (project, userId) => {
  const uid = userId.toString();
  return (
    project.user.toString() === uid ||
    project.members.some((m) => m.toString() === uid)
  );
};

// @route GET /api/projects
// Returns projects the user owns AND projects they've been invited into as a team member
const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ user: req.user._id }, { members: req.user._id }],
    }).sort({ createdAt: -1 });

    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const total = await Task.countDocuments({ project: project._id });
        const done = await Task.countDocuments({ project: project._id, status: 'Done' });
        return {
          ...project.toObject(),
          taskCount: total,
          doneCount: done,
          isOwner: project.user.toString() === req.user._id.toString(),
        };
      })
    );

    res.json(projectsWithStats);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/projects/:id
const getProject = async (req, res, next) => {
  try {
    // IMPORTANT: check access on the raw (unpopulated) document first — once
    // `user`/`members` are populated they become full objects, not plain
    // ObjectIds, and hasAccess()'s string comparison would silently fail.
    const project = await Project.findById(req.params.id);
    if (!project || !hasAccess(project, req.user._id)) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.populate('members', 'name email avatar');
    await project.populate('user', 'name email avatar');

    res.json({ ...project.toObject(), isOwner: project.user._id.toString() === req.user._id.toString() });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { title, description, color } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Project title is required' });
    }

    const project = await Project.create({
      title: title.trim(),
      description: description?.trim() || '',
      color: color || '#6366f1',
      user: req.user._id,
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/projects/:id  (owner only)
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found, or you do not own it' });
    }

    const { title, description, color } = req.body;
    if (title !== undefined) project.title = title.trim();
    if (description !== undefined) project.description = description.trim();
    if (color !== undefined) project.color = color;

    const updated = await project.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/projects/:id  (owner only)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found, or you do not own it' });
    }

    const taskCount = await Task.countDocuments({ project: project._id });
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    // Best-effort email receipt — the on-screen confirmation dialog already
    // gates the action, this is just a record. Never blocks the response.
    sendEmail({
      to: req.user.email,
      subject: `TaskFlow: "${project.title}" was deleted`,
      html: `
        <p>Hi ${req.user.name},</p>
        <p>This confirms that your project <strong>${project.title}</strong> and its ${taskCount} task(s) were permanently deleted.</p>
        <p>If you didn't do this, please secure your account and contact support.</p>
      `,
    }).catch(() => {
      /* SMTP not configured or send failed — deletion already succeeded, nothing to roll back */
    });

    res.json({ message: 'Project and its tasks deleted', id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/projects/:id/invite  (owner only) — body: { email }
const inviteMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Please provide an email address to invite' });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found, or you do not own it' });
    }

    if (normalizedEmail === req.user.email) {
      return res.status(400).json({ message: "You're already the owner of this project" });
    }

    const invitedUser = await User.findOne({ email: normalizedEmail });

    if (invitedUser) {
      const alreadyMember = project.members.some((m) => m.toString() === invitedUser._id.toString());
      if (alreadyMember) {
        return res.status(400).json({ message: 'That person is already on this project' });
      }
      project.members.push(invitedUser._id);
      await project.save();
      const populated = await project.populate('members', 'name email avatar');
      return res.status(200).json({ message: `${invitedUser.name} added to the project`, project: populated });
    }

    // No account yet — store the invite and auto-apply it when they sign up
    if (!project.pendingInvites.includes(normalizedEmail)) {
      project.pendingInvites.push(normalizedEmail);
      await project.save();
    }
    res.status(200).json({
      message: `${normalizedEmail} doesn't have a TaskFlow account yet — they'll be added automatically once they sign up.`,
      project,
    });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/projects/:id/members/:userId  (owner only)
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found, or you do not own it' });
    }

    project.members = project.members.filter((m) => m.toString() !== req.params.userId);
    await project.save();

    res.json({ message: 'Member removed', id: req.params.userId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  inviteMember,
  removeMember,
  hasAccess,
};
