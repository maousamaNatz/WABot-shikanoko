const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  const number = req.body.number;
  const user = await User.findOne({ where: { number } });

  if (!user) {
    return res.status(403).send('User not found');
  }

  req.user = user;
  next();
};

const isAdmin = (req, res, next) => {
  if (req.user.type !== 'admin') {
    return res.status(403).send('Access denied');
  }
  next();
};

const isSuperAdmin = (req, res, next) => {
  if (req.user.type !== 'superadmin') {
    return res.status(403).send('Access denied');
  }
  next();
};

const isDev = (req, res, next) => {
  if (req.user.type !== 'dev') {
    return res.status(403).send('Access denied');
  }
  next();
};

module.exports = {
  authMiddleware,
  isAdmin,
  isSuperAdmin,
  isDev,
};
