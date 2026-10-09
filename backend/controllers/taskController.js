const Task = require('../models/Task');
const Project = require('../models/Project');
const { hasAccess } = require('./projectController');

// Loads a project and 404s unless the requesting user owns it or is a member
const loadAccessibleProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project || !hasAccess(project, userId)) return null;
  return project;
};

const getAccessibleProjectIds = async (userId) => {
  return Project.find({ $or: [{ user: userId }, { members: userId }] }).distinct('_id');
};

// @route GET /api/tasks?project=&status=&priority=&search=&sortBy=
// A project's tasks are visible to every member of that project, not just the creator —
// that's what makes this a shared/team board rather than a personal list.
const getTasks = async (req, res, next) => {
  try {
    const { project, status, priority, search, sortBy } = req.query;

    if (!project) {
      return res.status(400).json({ message: 'A project query parameter is required' });
    }

    const projectDoc = await loadAccessibleProject(project, req.user._id);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const filter = { project };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.title = { $regex: search, $options: 'i' };

    let sort = { createdAt: -1 };
    if (sortBy === 'dueDate') sort = { dueDate: 1 };
    if (sortBy === 'priority') sort = { priority: -1 };

    const tasks = await Task.find(filter).sort(sort).populate('project', 'title color').populate('user', 'name avatar');
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/tasks/stats  (dashboard analytics — across every project the user can access)
const getTaskStats = async (req, res, next) => {
  try {
    const accessibleProjectIds = await getAccessibleProjectIds(req.user._id);
    const baseFilter = { project: { $in: accessibleProjectIds } };

    const [todo, inProgress, done, highPriority, overdue] = await Promise.all([
      Task.countDocuments({ ...baseFilter, status: 'Todo' }),
      Task.countDocuments({ ...baseFilter, status: 'In Progress' }),
      Task.countDocuments({ ...baseFilter, status: 'Done' }),
      Task.countDocuments({ ...baseFilter, priority: 'High', status: { $ne: 'Done' } }),
      Task.countDocuments({
        ...baseFilter,
        status: { $ne: 'Done' },
        dueDate: { $lt: new Date(), $ne: null },
      }),
    ]);

    const total = todo + inProgress + done;

    res.json({ total, todo, inProgress, done, highPriority, overdue });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/tasks/progress?days=7
// Returns one entry per day for the last N days: how many tasks were completed
// that day and how many were created that day. Powers the Profile page chart.
const getProgressReport = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
    const accessibleProjectIds = await getAccessibleProjectIds(req.user._id);

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const [completedTasks, createdTasks] = await Promise.all([
      Task.find({
        project: { $in: accessibleProjectIds },
        completedAt: { $gte: startDate, $lte: today },
      }).select('completedAt'),
      Task.find({
        project: { $in: accessibleProjectIds },
        createdAt: { $gte: startDate, $lte: today },
      }).select('createdAt'),
    ]);

    // Build a zero-filled bucket per day so the chart has no gaps
    const buckets = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: key, completed: 0, created: 0 };
    }

    completedTasks.forEach((t) => {
      const key = t.completedAt.toISOString().slice(0, 10);
      if (buckets[key]) buckets[key].completed += 1;
    });
    createdTasks.forEach((t) => {
      const key = t.createdAt.toISOString().slice(0, 10);
      if (buckets[key]) buckets[key].created += 1;
    });

    res.json(Object.values(buckets));
  } catch (error) {
    next(error);
  }
};

// @route GET /api/tasks/progress/day?date=YYYY-MM-DD
// Returns the tasks completed and created on one specific day.
const getProgressForDate = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date || Number.isNaN(Date.parse(date))) {
      return res.status(400).json({ message: 'A valid date query parameter (YYYY-MM-DD) is required' });
    }

    const accessibleProjectIds = await getAccessibleProjectIds(req.user._id);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [completed, created] = await Promise.all([
      Task.find({
        project: { $in: accessibleProjectIds },
        completedAt: { $gte: dayStart, $lte: dayEnd },
      }).populate('project', 'title color'),
      Task.find({
        project: { $in: accessibleProjectIds },
        createdAt: { $gte: dayStart, $lte: dayEnd },
      }).populate('project', 'title color'),
    ]);

    res.json({ date, completed, created });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/tasks/due-tomorrow
// Used by the frontend to fire a browser notification reminder.
const getDueTomorrowTasks = async (req, res, next) => {
  try {
    const accessibleProjectIds = await getAccessibleProjectIds(req.user._id);

    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      project: { $in: accessibleProjectIds },
      status: { $ne: 'Done' },
      dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
    }).populate('project', 'title');

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, project } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }
    if (!project) {
      return res.status(400).json({ message: 'A project must be specified for this task' });
    }

    const projectDoc = await loadAccessibleProject(project, req.user._id);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const resolvedStatus = status || 'Todo';
    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      status: resolvedStatus,
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      completedAt: resolvedStatus === 'Done' ? new Date() : null,
      project,
      user: req.user._id, // who created it — kept for attribution, not for access control
    });

    const populated = await task.populate([
      { path: 'project', select: 'title color' },
      { path: 'user', select: 'name avatar' },
    ]);
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/tasks/:id  (any project member can edit — simple shared-board permission model)
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const projectDoc = await loadAccessibleProject(task.project, req.user._id);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, status, priority, dueDate } = req.body;
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;

    if (status !== undefined && status !== task.status) {
      task.status = status;
      // Track when it entered/left Done — this is the data the progress chart reads
      if (status === 'Done') {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }
    }

    const updated = await task.save();
    const populated = await updated.populate([
      { path: 'project', select: 'title color' },
      { path: 'user', select: 'name avatar' },
    ]);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/tasks/:id  (any project member can delete)
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const projectDoc = await loadAccessibleProject(task.project, req.user._id);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted', id: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskStats,
  getProgressReport,
  getProgressForDate,
  getDueTomorrowTasks,
  createTask,
  updateTask,
  deleteTask,
};
