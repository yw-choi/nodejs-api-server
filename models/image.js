import mongoose from 'mongoose';

const { Model, Schema } = mongoose;

const schema = new Schema(
  {
    originalName: String,
    encoding: String,
    mimetype: String,
    destination: String,
    filename: String,
    path: String,
    size: Number,
    thumbnail: {
      path: String,
      size: [Number, Number],
    },
  },
  { timestamps: true }
);

const Image = mongoose.model('Image', schema);
export default Image;
