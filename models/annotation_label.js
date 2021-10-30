import mongoose from 'mongoose';

const { Model, Schema } = mongoose;

const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    text: String,
  },
  { timestamps: true }
);

const AnnotationLabel = mongoose.model('AnnotationLabel', schema);
export default AnnotationLabel;
