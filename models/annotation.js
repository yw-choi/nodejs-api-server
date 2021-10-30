import mongoose from 'mongoose';

const { Model, Schema } = mongoose;

const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    image: { type: Schema.Types.ObjectId, ref: 'Image', index: true },
    label: { type: Schema.Types.ObjectId, ref: 'AnnotationLabel' },
    type: String,
    data: [[Number, Number]],
  },
  { timestamps: true }
);

const Annotation = mongoose.model('Annotation', schema);
export default Annotation;
