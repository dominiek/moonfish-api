
const { Router } = require('express');
const asyncRouter = require('../lib/async-router');

const {
  fetchSession,
  requireUser,
} = require('../middlewares/users');

const {
  signup,
  authenticate,
  encodeSession,
  exportSafeUser,
} = require('../lib/users');

const User = require('../models/user');

const api = asyncRouter(Router());

api.use(fetchSession);

// Create user (signup)
api.post('/', async (req, res) => {
  const rawUser = await signup(req.body);
  const user = exportSafeUser(rawUser);
  res.json({ result: user });
});

// Create session (login)
api.post('/sessions', async (req, res) => {
  const rawUser = await authenticate(req.body.email, req.body.password);
  const token = encodeSession(rawUser._id); //eslint-disable-line
  const user = exportSafeUser(rawUser);
  res.json({ result: { user, token } });
});

// Get self (user info)
api.get('/self', requireUser(), (req, res) => {
  const user = exportSafeUser(req.user);
  res.json({ result: user });
});

// Update self (user profile)
api.post('/self', requireUser(), async (req, res) => {
  ['name'].forEach((validField) => {
    if (req.body[validField]) {
      req.user[validField] = req.body[validField];
    }
  });
  await req.user.save();
  const user = exportSafeUser(req.user);
  res.json({ result: user });
});

// Delete self (user profile)
api.delete('/self', requireUser(), async (req, res) => {
  await req.user.remove();
  res.json({ result: { success: true } });
});

// Admin get user
api.get('/:id', requireUser('admin'), async (req, res) => {
  const rawUser = await User.findById(req.params.id);
  const user = exportSafeUser(rawUser);
  res.json({ result: user });
});

// Admin delete user
api.delete('/:id', requireUser('admin'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new Error('No such user');
  await user.remove();
  return res.json({ result: { success: true } });
});

// Admin update user
api.post('/:id', requireUser('admin'), async (req, res) => {
  const rawUser = await User.findById(req.params.id);
  if (!rawUser) throw new Error('No such user');
  rawUser.set(req.body);
  await rawUser.save();
  const user = exportSafeUser(rawUser);
  return res.json({ result: user });
});

module.exports = api;