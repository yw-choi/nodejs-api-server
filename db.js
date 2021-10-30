import mongoose from "mongoose";
import { DB_CONFIG } from "./config.js";

const db = {};

db.mongoose = mongoose;

db.connect = function () {
  this.mongoose
    .connect(`mongodb://${DB_CONFIG.HOST}:${DB_CONFIG.PORT}/${DB_CONFIG.DB}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })
    .then(() => {
      console.log("mongodb connection success");
    })
    .catch((err) => {
      console.error("mongodb connection error", err);
      process.exit();
    });
};

export default db;
