import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import User from '../models/User.js';
import Session from '../models/Session.js';

export const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: '30d',
  });

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) token = auth.split(' ')[1];
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('User no longer exists');
    }
    if (user.isActive === false) {
      res.status(401);
      throw new Error('Account has been deactivated. Please contact support.');
    }

    // Verify session is active in the database (concurrency check)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const activeSession = await Session.findOne({ tokenHash, userId: user._id, isActive: true });
    if (!activeSession) {
      res.status(401);
      throw new Error('Session has expired or logged out from another device.');
    }

    req.user = user;
    next();
  } catch (e) {
    res.status(401);
    throw new Error(e.message || 'Not authorized, token invalid');
  }
});

export const protectTemp = asyncHandler(async (req, res, next) => {
  let token;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) token = auth.split(' ')[1];
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('User no longer exists');
    }
    if (user.isActive === false) {
      res.status(401);
      throw new Error('Account has been deactivated. Please contact support.');
    }
    req.user = user;
    next();
  } catch (e) {
    res.status(401);
    throw new Error(e.message || 'Not authorized, token invalid');
  }
});

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403);
  throw new Error('Admin access only');
};

// Soft-protect: decodes token if present, but does not reject if absent.
export const softAuth = asyncHandler(async (req, _res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return next();
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'dev_secret');
    const user = await User.findById(decoded.id).select('-password');
    if (user) req.user = user;
  } catch {
    /* ignore */
  }
  next();
});
