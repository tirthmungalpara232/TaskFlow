const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Project = require('../models/Project');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// If this email was invited to any projects before they had an account,
// add them as a member now and clear the pending invite.
const applyPendingInvites = async (user) => {
  await Project.updateMany(
    { pendingInvites: user.email },
    {
      $addToSet: { members: user._id },
      $pull: { pendingInvites: user.email },
    }
  );
};

// @route POST /api/auth/register
const registerUser = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, username, email and password' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) {
      return res.status(400).json({
        message: 'Username must be 3-20 characters, using only letters, numbers, underscores and dots',
      });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const existingUsername = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUsername) {
      return res.status(400).json({ message: 'That username is already taken' });
    }

    const user = await User.create({ name: name.trim(), username: username.toLowerCase().trim(), email: email.toLowerCase().trim(), password });
    await applyPendingInvites(user);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/login
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/auth/profile
// Lets a user change their display name, username, and profile picture (as a
// data-URI string — the frontend resizes/compresses the image before sending it).
const updateProfile = async (req, res, next) => {
  try {
    const { name, username, avatar } = req.body;
    const user = req.user;

    if (username !== undefined && username !== user.username) {
      const normalized = username.toLowerCase().trim();
      if (!/^[a-z0-9_.]{3,20}$/.test(normalized)) {
        return res.status(400).json({
          message: 'Username must be 3-20 characters, using only letters, numbers, underscores and dots',
        });
      }
      const taken = await User.findOne({ username: normalized, _id: { $ne: user._id } });
      if (taken) {
        return res.status(400).json({ message: 'That username is already taken' });
      }
      user.username = normalized;
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      user.name = name.trim();
    }

    if (avatar !== undefined) {
      user.avatar = avatar; // '' clears it back to initials fallback
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/forgot-password
// Always responds with a generic success message, whether or not the email
// exists — this avoids leaking which emails have accounts.
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const genericResponse = {
      message: 'If an account with that email exists, a reset link has been sent.',
    };

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.json(genericResponse);
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const clientUrl = (process.env.CLIENT_URL || 'https://taskflow-2ube.onrender.com').split(',')[0];
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    console.log(`\n🔗 [Password Reset Link] for ${user.email}:\n${resetUrl}\n`);

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your TaskFlow password',
        html: `
          <p>You requested a password reset for your TaskFlow account.</p>
          <p><a href="${resetUrl}">Click here to reset your password</a> (expires in 30 minutes).</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Email send failed:', emailError);
      return res.status(500).json({ message: 'Could not send reset email. Check SMTP configuration on the server.' });
    }

    res.json(genericResponse);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// Shared handler for both Google and GitHub OAuth callbacks: passport has
// already attached the user to req.user, so we just issue our JWT and
// redirect back to the frontend with it in the query string.
const oauthCallback = async (req, res) => {
  const clientUrl = (process.env.CLIENT_URL || 'https://taskflow-2ube.onrender.com').split(',')[0];

  if (!req.user) {
    return res.redirect(`${clientUrl}/login?error=oauth_failed`);
  }

  await applyPendingInvites(req.user);
  const token = generateToken(req.user._id);
  res.redirect(`${clientUrl}/oauth-callback?token=${token}`);
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  oauthCallback,
};
