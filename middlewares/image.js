import User from '../models/user.js';
import Image from '../models/image.js';
import UserImage from '../models/user_image.js';
import mongoose from 'mongoose';

export const verifyUserImagePermission = async (req, res, next) => {
  const imageId = req.params.id;
  const userId = req.userId;
  console.log(`verifyPermission: userId = ${userId}, imageId = ${imageId}`);

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(imageId)) {
    console.log('invalid object ids');
    return res.status(400).send({ msg: 'bad request' });
  }

  try {
    const userImage = await UserImage.findOne({
      user: userId,
      image: imageId,
    }).exec();

    console.log(userImage);

    if (userImage) {
      console.log('user id = ' + userId + ' has permission to ' + imageId);
      next();
    } else {
      console.log(
        'user id = ' + userId + ' DONT have permission to ' + imageId
      );

      res.status(401).send({ msg: 'Unauthorized!' });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ msg: 'db failure' });
  }
};
