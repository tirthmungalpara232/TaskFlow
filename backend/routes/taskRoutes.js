const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskStats,
  getProgressReport,
  getProgressForDate,
  getDueTomorrowTasks,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect); // every task route requires authentication

// Specific routes must come before /:id-style routes so they aren't swallowed by it
router.get('/stats', getTaskStats);
router.get('/progress', getProgressReport);
router.get('/progress/day', getProgressForDate);
router.get('/due-tomorrow', getDueTomorrowTasks);

router.route('/').get(getTasks).post(createTask);
router.route('/:id').put(updateTask).delete(deleteTask);

module.exports = router;
