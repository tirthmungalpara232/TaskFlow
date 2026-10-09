const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  oauthCallback,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// --- Google OAuth ---
// Kicks off the flow (frontend links/redirects the browser here)
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ message: 'Google sign-in is not configured on this server' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});
router.get(
  '/google/callback',
  (req, res, next) => passport.authenticate('google', { session: false, failureRedirect: '/login' })(req, res, next),
  oauthCallback
);

// --- GitHub OAuth ---
router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(503).json({ message: 'GitHub sign-in is not configured on this server' });
  }
  passport.authenticate('github', { scope: ['user:email'], session: false })(req, res, next);
});
router.get(
  '/github/callback',
  (req, res, next) => passport.authenticate('github', { session: false, failureRedirect: '/login' })(req, res, next),
  oauthCallback
);

module.exports = router;
