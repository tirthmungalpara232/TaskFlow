const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // null   => group message, visible to every member of the project
    // set    => direct message, visible only to sender + receiver (see
    //           chatController's $or query — that's what actually enforces this)
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message cannot be empty'],
      trim: true,
      maxlength: 3000,
    },
  },
  { timestamps: true }
);

// Fast feed load for the group tab
MessageSchema.index({ project: 1, receiver: 1, createdAt: 1 });
// Fast load for one specific DM thread
MessageSchema.index({ project: 1, sender: 1, receiver: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
