import mongoose from "mongoose";

const { Model, Schema } = mongoose;

const schema = new Schema(
  {
    username: String,
    email: { type: String, index: true },
    password: String,
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", schema);
export default User;
