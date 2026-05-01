const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');

module.exports = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
  }, (accessToken, refreshToken, profile, done) => done(null, profile)));

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/auth/github/callback`,
  }, (accessToken, refreshToken, profile, done) => done(null, profile)));

  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login` }),
    (req, res) => {
      const token = jwt.sign(
        { id: req.user.id, email: req.user.emails?.[0]?.value },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
    }
  );

  app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: `${process.env.CLIENT_URL}/login` }),
    (req, res) => {
      const token = jwt.sign(
        { id: req.user.id, email: req.user.emails?.[0]?.value },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
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