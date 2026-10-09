const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 50,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: 20,
      match: [/^[a-z0-9_.]+$/, 'Username can only contain lowercase letters, numbers, underscores and dots'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      // Not required for OAuth accounts (Google/GitHub) — they never set a local password
      required: function () {
        return !this.googleId && !this.githubId;
      },
      minlength: 6,
      select: false, // never return password by default
    },
    avatar: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      default: null,
      index: true,
    },
    githubId: {
      type: String,
      default: null,
      index: true,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving (skipped for OAuth users with no password, or if unchanged)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // OAuth-only accounts have no local password
  return bcrypt.compare(candidatePassword, this.password);
};

// Generates a random reset token, stores its hash + expiry on the user, and
// returns the *unhashed* token (this is what gets emailed / put in the reset link).
UserSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
