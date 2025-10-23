const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token is not valid' 
      });
    }

    req.user = { userId: decoded.userId, role: user.role };
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid' 
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Authentication failed' 
    });
  }
};

module.exports = { auth, adminAuth };
