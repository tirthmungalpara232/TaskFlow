const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Turns an email/name into a URL-safe base, then appends numbers until it's unique.
// OAuth users never fill out the registration form, so we still need to give
// them a valid username — they can change it later from their profile.
const generateUniqueUsername = async (seed) => {
  const base = (seed || 'user')
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '')
    .slice(0, 16) || 'user';

  let candidate = base;
  let suffix = 0;
  while (await User.findOne({ username: candidate })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
};

// Finds an existing user by OAuth id or email, or creates a new one.
// Shared by both providers so registration/login behave identically either way.
const findOrCreateOAuthUser = async ({ provider, providerId, name, email, avatar }) => {
  const idField = provider === 'google' ? 'googleId' : 'githubId';

  let user = await User.findOne({ [idField]: providerId });
  if (user) return user;

  // Same email already registered (e.g. via normal signup, or the other OAuth
  // provider) — link this provider to that existing account instead of duplicating it.
  if (email) {
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user[idField] = providerId;
      if (!user.avatar && avatar) user.avatar = avatar;
      await user.save();
      return user;
    }
  }

  const username = await generateUniqueUsername(email || name);

  user = await User.create({
    name: name || 'TaskFlow User',
    username,
    email: email ? email.toLowerCase() : `${providerId}@${provider}.oauth`,
    avatar: avatar || '',
    [idField]: providerId,
  });

  return user;
};

// Only registers a strategy if its credentials are actually configured, so the
// server doesn't crash for people who haven't set up OAuth yet.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser({
            provider: 'google',
            providerId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            avatar: profile.photos?.[0]?.value,
          });
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/github/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser({
            provider: 'github',
            providerId: profile.id,
            name: profile.displayName || profile.username,
            email: profile.emails?.[0]?.value,
            avatar: profile.photos?.[0]?.value,
          });
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}

module.exports = passport;
