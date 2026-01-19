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
  kills: Joi.number().integer().min(0).max(100).required(),
  damage: Joi.number().min(0).max(10000).required(),
  survival_time: Joi.number().min(0).max(1800), // seconds
  placement: Joi.number().integer().min(1).max(100).required(),
  screenshots: Joi.array().items(Joi.string().uri()).max(5),
  video_link: Joi.string().uri().allow(''),
  description: Joi.string().max(500).allow(''),
  evidence: Joi.object({
    type: Joi.string().valid('screenshot', 'video', 'stream').required(),
    url: Joi.string().uri().required()
  })
});

// 🔥 WITHDRAWAL VALIDATION SCHEMAS
const requestWithdrawalSchema = Joi.object({
  amount: Joi.number().min(100).max(50000).required(),
  payment_method: Joi.string().valid('bkash', 'nagad', 'rocket', 'bank').required(),
  account_details: Joi.object({
    phone: Joi.when('payment_method', {
      is: Joi.string().valid('bkash', 'nagad', 'rocket'),
      then: Joi.string().custom(validatePhoneBD, 'Phone validation').required(),
      otherwise: Joi.forbidden()
    }),
    account_number: Joi.when('payment_method', {
      is: 'bank',
      then: Joi.string().required(),
      otherwise: Joi.forbidden()
    }),
    account_name: Joi.when('payment_method', {
      is: 'bank',
      then: Joi.string().required(),
      otherwise: Joi.forbidden()
    }),
    bank_name: Joi.when('payment_method', {
      is: 'bank',
      then: Joi.string().required(),
      otherwise: Joi.forbidden()
    }),
    branch: Joi.string().allow('')
  }).required(),
  user_note: Joi.string().max(500).allow('')
});

const approveWithdrawalSchema = Joi.object({
  transaction_id: Joi.string().required(),
  admin_notes: Joi.string().max(500).allow(''),
  verification_code: Joi.when(Joi.ref('$payment_method'), {
    is: Joi.string().valid('bkash', 'nagad', 'rocket'),
    then: Joi.string().length(6).required(),
    otherwise: Joi.optional()
  })
});

// 🔥 POST & CONTENT VALIDATION SCHEMAS
const createPostSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  content: Joi.string().min(10).max(10000).required(),
  excerpt: Joi.string().max(300).allow(''),
  category: Joi.string().max(50),
  tags: Joi.array().items(Joi.string().max(30)).max(10),
  is_published: Joi.boolean().default(true),
  allow_comments: Joi.boolean().default(true),
  featured_image: Joi.string().uri().allow(''),
  meta_title: Joi.string().max(70).allow(''),
  meta_description: Joi.string().max(160).allow('')
});

const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  post_id: Joi.string().custom(validateObjectId, 'ObjectId validation').required(),
  parent_id: Joi.string().custom(validateObjectId, 'ObjectId validation').allow('')
});

// 🔥 MEDIA VALIDATION SCHEMAS
const uploadMediaSchema = Joi.object({
  title: Joi.string().max(200).allow(''),
  description: Joi.string().max(1000).allow(''),
  tags: Joi.array().items(Joi.string().max(30)).max(10),
  is_public: Joi.boolean().default(true),
  category: Joi.string().max(50).allow('')
});

// 🔥 USER VALIDATION SCHEMAS
const updateProfileSchema = Joi.object({
  name: Joi.string().max(50).allow(''),
  bio: Joi.string().max(500).allow(''),
  location: Joi.string().max(100).allow(''),
  website: Joi.string().uri().allow(''),
  social_links: Joi.object({
    facebook: Joi.string().uri().allow(''),
    youtube: Joi.string().uri().allow(''),
    twitter: Joi.string().uri().allow(''),
    instagram: Joi.string().uri().allow(''),
    discord: Joi.string().allow('')
  }),
  gaming_preferences: Joi.object({
    favorite_game: Joi.string().max(50),
    play_style: Joi.string().valid('aggressive', 'defensive', 'balanced'),
    device: Joi.string().valid('mobile', 'pc', 'console')
  })
});

// 🔥 SUPPORT VALIDATION SCHEMAS
const createTicketSchema = Joi.object({
  subject: Joi.string().min(5).max(200).required(),
  category: Joi.string().valid('technical', 'billing', 'account', 'tournament', 'other').required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  message: Joi.string().min(10).max(5000).required(),
  order_id: Joi.string().allow(''),
  screenshot_url: Joi.string().uri().allow('')
});

// 🔥 ADMIN VALIDATION SCHEMAS
const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('user', 'premium_user', 'moderator', 'admin', 'super_admin').required(),
  reason: Joi.string().max(500).allow(''),
  permissions: Joi.array().items(Joi.string()).optional()
});

const updateSystemSettingsSchema = Joi.object({
  site_name: Joi.string().max(100),
  site_url: Joi.string().uri(),
  contact_email: Joi.string().email(),
  support_email: Joi.string().email(),
  currency: Joi.string().length(3),
  min_withdrawal: Joi.number().min(0),
  max_withdrawal: Joi.number().min(Joi.ref('min_withdrawal')),
  withdrawal_fee_percentage: Joi.number().min(0).max(100),
  tournament_fee_percentage: Joi.number().min(0).max(100),
  maintenance_mode: Joi.boolean(),
  registration_enabled: Joi.boolean(),
  email_verification_required: Joi.boolean()
});

// 🔥 VALIDATION MIDDLEWARE
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      context: req[property] // For conditional validation
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors,
        timestamp: new Date().toISOString()
      });
    }

    // Replace validated data
    req[property] = value;
    next();
  };
};

// 🔥 FILE VALIDATION MIDDLEWARE
const validateFile = (options = {}) => {
  return (req, res, next) => {
    if (!req.file && !options.optional) {
      return res.status(400).json({
        success: false,
        code: 'FILE_REQUIRED',
        message: 'File is required',
        timestamp: new Date().toISOString()
      });
    }

    if (req.file) {
      const { maxSize, allowedTypes } = options;
      
      // Check file size
      if (maxSize && req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
          maxSize: maxSize,
          fileSize: req.file.size,
          timestamp: new Date().toISOString()
        });
      }

      // Check file type
      if (allowedTypes && allowedTypes.length > 0) {
        const fileType = req.file.mimetype;
        const fileExt = req.file.originalname.split('.').pop().toLowerCase();
        
        const isValidType = allowedTypes.some(type => {
          if (type.startsWith('.')) {
            return fileExt === type.substring(1);
          }
          return fileType.startsWith(type);
        });

        if (!isValidType) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_FILE_TYPE',
            message: `Allowed file types: ${allowedTypes.join(', ')}`,
            fileType: fileType,
            allowedTypes,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    next();
  };
};

// 🔥 QUERY PARAMS VALIDATION
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        code: 'QUERY_VALIDATION_ERROR',
        message: 'Invalid query parameters',
        errors,
        timestamp: new Date().toISOString()
      });
    }

    req.query = value;
    next();
  };
};

// 🔥 PARAMS VALIDATION
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        code: 'PARAMS_VALIDATION_ERROR',
        message: 'Invalid URL parameters',
        errors,
        timestamp: new Date().toISOString()
      });
    }

    req.params = value;
    next();
  };
};

// 🔥 EXPORT ALL VALIDATORS
module.exports = {
  // Schemas
  registerSchema,
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema,
  createTournamentSchema,
  joinTournamentSchema,
  createMatchSchema,
  submitResultSchema,
  requestWithdrawalSchema,
  approveWithdrawalSchema,
  createPostSchema,
  createCommentSchema,
  uploadMediaSchema,
  updateProfileSchema,
  createTicketSchema,
  updateUserRoleSchema,
  updateSystemSettingsSchema,
  paginationSchema,
  dateRangeSchema,
  
  // Validation middleware
  validate,
  validateFile,
  validateQuery,
  validateParams,
  
  // Validation helper functions
  validateObjectId,
  validatePhoneBD,
  validateEmail,
  validateUsername
};
