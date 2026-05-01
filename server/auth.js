const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const User = require('./models/User');

module.exports = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: Math.random().toString(36),
          avatar: profile.photos?.[0]?.value || ''
        });
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }));

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/auth/github/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: profile.displayName || profile.username,
          email,
          password: Math.random().toString(36),
          avatar: profile.photos?.[0]?.value || ''
        });
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }));

  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login` }),
    (req, res) => {
      const token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
    }
  );

  app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: `${process.env.CLIENT_URL}/login` }),
    (req, res) => {
      const token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
    }
  );

  app.get('/auth/me', (req, res) => {
    req.user ? res.json(req.user) : res.status(401).json({ error: 'Not authenticated' });
  });

  app.get('/auth/logout', (req, res) => {
    req.logout(() => res.redirect(process.env.CLIENT_URL));
  });
};