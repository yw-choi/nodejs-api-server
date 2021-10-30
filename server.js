import express from 'express';
import morgan from 'morgan';
import { PORT, MORGAN_LOGLEVEL, UPLOAD_DIR, CORS_OPTIONS } from './config.js';
import router from './router.js';
import db from './db.js';
import cors from 'cors';

db.connect();

const app = express();

app.use(cors(CORS_OPTIONS));
app.use(morgan(MORGAN_LOGLEVEL));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(router);

app.use((req, res) => {
  res.status(404).send({ msg: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ msg: err.message });
});

app.listen(PORT, () => {
  console.log('Listening to port ' + PORT);
});
