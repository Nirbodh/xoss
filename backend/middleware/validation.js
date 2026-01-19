// middleware/validation.js - COMPLETE VALIDATION MIDDLEWARE
const Joi = require('joi');
const mongoose = require('mongoose');

// 🔥 VALIDATION HELPER FUNCTIONS
const validateObjectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const validatePhoneBD = (value, helpers) => {
  const regex = /^01[3-9]\d{8}$/;
  if (!regex.test(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const validateEmail = (value, helpers) => {
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!regex.test(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const validateUsername = (value, helpers) => {
  const regex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!regex.test(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

// 🔥 COMMON SCHEMAS
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('-createdAt'),
  search: Joi.string().allow('').max(100)
});

const dateRangeSchema = Joi.object({
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')),
  timezone: Joi.string().default('UTC')
});

// 🔥 AUTH VALIDATION SCHEMAS
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required()
    .custom(validateUsername, 'Username validation'),
  email: Joi.string().email().required()
    .custom(validateEmail, 'Email validation'),
  phone: Joi.string().custom(validatePhoneBD, 'Bangladeshi phone validation'),
  password: Joi.string().min(8).max(100).required(),
  name: Joi.string().max(50),
  referral_code: Joi.string().max(20),
  accept_terms: Joi.boolean().valid(true).required()
});

const loginSchema = Joi.object({
  identifier: Joi.string().required(),
  password: Joi.string().required(),
  remember_me: Joi.boolean().default(false)
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).max(100).required(),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(100).required(),
  confirm_password: Joi.string().valid(Joi.ref('password')).required()
});

// 🔥 TOURNAMENT VALIDATION SCHEMAS
const createTournamentSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  game: Joi.string().valid('Free Fire', 'PUBG Mobile', 'COD Mobile', 'BGMI', 'Other').required(),
  description: Joi.string().max(2000).allow(''),
  rules: Joi.string().max(5000).allow(''),
  entry_fee: Joi.number().min(0).max(100000).required(),
  total_prize: Joi.number().min(0).max(1000000),
  per_kill: Joi.number().min(0).max(10000),
  max_participants: Joi.number().integer().min(2).max(200).required(),
  min_participants: Joi.number().integer().min(2).max(200).default(4),
  type: Joi.string().valid('Solo', 'Duo', 'Squad', 'Custom').default('Squad'),
  map: Joi.string().default('Bermuda'),
  mode: Joi.string().default('Classic'),
  platform: Joi.string().valid('Mobile', 'PC', 'Console', 'Cross-Platform').default('Mobile'),
  schedule_time: Joi.date().iso().required(),
  start_time: Joi.date().iso().required(),
  end_time: Joi.date().iso().min(Joi.ref('start_time')).required(),
  registration_deadline: Joi.date().iso().max(Joi.ref('schedule_time')),
  room_id: Joi.string().allow(''),
  room_password: Joi.string().allow(''),
  streaming_link: Joi.string().uri().allow(''),
  check_in_required: Joi.boolean().default(false),
  check_in_time: Joi.when('check_in_required', {
    is: true,
    then: Joi.date().iso().required(),
    otherwise: Joi.date().iso().optional()
  }),
  thumbnail: Joi.string().uri().allow(''),
  tags: Joi.array().items(Joi.string().max(50)).max(10),
  is_private: Joi.boolean().default(false),
  requires_verification: Joi.boolean().default(false),
  prize_distribution: Joi.array().items(Joi.number().min(0).max(100)).min(1).max(10)
    .custom((value, helpers) => {
      const total = value.reduce((sum, num) => sum + num, 0);
      if (Math.abs(total - 100) > 0.01) {
        return helpers.error('any.invalid', { message: 'Prize distribution must sum to 100%' });
      }
      return value;
    }, 'Prize distribution validation')
});

const joinTournamentSchema = Joi.object({
  game_uid: Joi.string().required(),
  game_name: Joi.string().max(50).required(),
  region: Joi.string().default('BD'),
  device: Joi.string().valid('mobile', 'pc', 'console').default('mobile'),
  player_name: Joi.string().max(50)
});

// 🔥 MATCH VALIDATION SCHEMAS
const createMatchSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  game: Joi.string().valid('Free Fire', 'PUBG Mobile', 'COD Mobile', 'BGMI', 'Other').required(),
  type: Joi.string().valid('Solo', 'Duo', 'Squad', 'Custom').required(),
  mode: Joi.string().required(),
  map: Joi.string().required(),
  entry_fee: Joi.number().min(0).max(5000).default(0),
  prize_pool: Joi.number().min(0).max(50000),
  max_players: Joi.number().integer().min(2).max(100).required(),
  schedule_time: Joi.date().iso().required(),
  start_time: Joi.date().iso().required(),
  room_id: Joi.string().required(),
  password: Joi.string().allow(''),
  description: Joi.string().max(1000).allow(''),
  rules: Joi.string().max(2000).allow(''),
  streaming_link: Joi.string().uri().allow(''),
  is_private: Joi.boolean().default(false)
});

const submitResultSchema = Joi.object({
  kills: Joi.number().integer().min(0).max(
