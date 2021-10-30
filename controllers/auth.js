import express from 'express';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import { JWT_EXPIRE, JWT_SECRET, STATUS_CODE } from '../config.js';
import bcrypt from 'bcryptjs';
import { verifyRegister, verifyLogin } from '../middlewares/auth.js';

const router = express.Router();

// BASE_URL is /auth
router.post('/register', verifyRegister, (req, res) => {
  const { email, password } = req.body;

  const user = new User({
    email: email,
    password: bcrypt.hashSync(password, 8),
  });

  user.save((err, user) => {
    if (err) {
      console.log(err);
      res.send({ status: STATUS_CODE.DB_FAILURE });
      return;
    }

    res.send({ status: STATUS_CODE.SUCCESS });
  });
});

router.post('/login', verifyLogin, (req, res) => {
  User.findOne({ email: req.body.email }).exec((err, user) => {
    if (err) {
      console.log(err);
      res.send({ status: STATUS_CODE.DB_FAILURE });
      return;
    }

    if (!user) {
      return res.send({ status: STATUS_CODE.AUTH_USER_NOT_FOUND });
    }

    var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

    if (!passwordIsValid) {
      return res.send({
        status: STATUS_CODE.AUTH_INVALID_PASSWORD,
      });
    }

    user.lastLoginAt = Date.now();
    user.save();

    var token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRE, // 24 hours
    });

    res.send({
      status: STATUS_CODE.SUCCESS,
      user: {
        id: user._id,
        email: user.email,
        accessToken: token,
      },
    });
  });
});

// router.post("/signout", (req, res) => {});

export default router;
