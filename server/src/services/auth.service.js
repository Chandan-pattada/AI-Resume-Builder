// ============================================
// auth.service.js - Authentication Service
// ============================================
// Business logic for registration, login,
// Google OAuth, and user profile retrieval.
// ============================================

import bcrypt from 'bcryptjs';

import User from '../models/User.model.js';

import { verifyGoogleToken } from '../config/google.config.js';

import { generateToken } from '../utils/jwt.utils.js';

export const register = async (name, email, password) => {
  const existing = await User.findOne({ email });

  if (existing) {
    const error = new Error('Email already registered.');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
  };
};

export const emailLogin = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user || !user.password) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  user.lastLogin = new Date();

  await user.save();

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
  };
};

// ============================================
// Google Login
// ============================================

export const googleLogin = async (credential) => {
  const googleUser = await verifyGoogleToken(credential);

  // Check if a user already exists with this email
  let user = await User.findOne({
    email: googleUser.email,
  });

  if (user) {
    // Existing account found.
    // Link the Google account to the existing user.
    user.googleId = googleUser.googleId;
    user.name = googleUser.name || user.name;
    user.picture = googleUser.picture || user.picture;
    user.lastLogin = new Date();

    await user.save();
  } else {
    // No existing account found.
    // Create a new Google user.
    user = await User.create({
      googleId: googleUser.googleId,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      lastLogin: new Date(),
    });
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
  };
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-__v -googleId');

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
};