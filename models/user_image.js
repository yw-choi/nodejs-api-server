import mongoose from 'mongoose';

const { Model, Schema } = mongoose;

const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    image: { type: Schema.Types.ObjectId, ref: 'Image', index: true },
  },
  { timestamps: true }
);

const UserImage = mongoose.model('UserImage', schema);
export default UserImage;
