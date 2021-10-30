import { check, validationResult } from 'express-validator';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, STATUS_CODE } from '../config.js';

export const verifyRegister = async (req, res, next) => {
  await check('email').isEmail().run(req);
  await check('password').isLength({ min: 8 }).run(req);
  await check('passwordConfirm')
    .custom((value, { req }) => {
      return req.body.password === value;
    })
    .run(req);

  const result = validationResult(req);
  if (!result.isEmpty()) {
    console.log(result);
    return res.send({
      status: STATUS_CODE.AUTH_REGISTER_VALIDATION_FAILURE,
    });
  }

  try {
    const user = await User.findOne({ email: req.body.email }).exec();
    if (user) {
      res.send({ status: STATUS_CODE.AUTH_DUPLICATE_EMAIL });
      return;
    }

    next();
  } catch (err) {
    console.log(err);
    res.send({ status: STATUS_CODE.DB_FAILURE });
  }
};

export const verifyLogin = async (req, res, next) => {
  await check('email').isEmail().run(req);
  await check('password').run(req);

  const result = validationResult(req);
  if (!result.isEmpty()) {
    console.log(result);
    return res.send({ status: STATUS_CODE.INVALID_INPUT });
  }

  next();
};

export const verifyToken = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.query.token;

  if (!token) {
    console.log('unauthorized access');
    return res.send({
      status: STATUS_CODE.UNAUTHORIZED_ACCESS,
    });
  }

  console.log('verifyToken: token = ' + token);

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.send({
        status: STATUS_CODE.UNAUTHORIZED_ACCESS,
      });
    }
    req.userId = decoded.id;
    console.log('verifyToken: userId = ' + req.userId);
    next();
  });
};
