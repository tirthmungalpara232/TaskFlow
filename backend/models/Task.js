const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Done'],
      default: 'Todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    // Set the moment status flips to 'Done', cleared if it's moved back out of Done.
    // This is what powers the progress-report charts (completed-per-day).
    completedAt: {
      type: Date,
      default: null,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index to speed up the common "my tasks in this project" query
TaskSchema.index({ user: 1, project: 1, status: 1 });

module.exports = mongoose.model('Task', TaskSchema);
