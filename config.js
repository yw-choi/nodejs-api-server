const ENV = 'dev-ec2';

const JWT_SECRET = '6363 christie ave';
const JWT_EXPIRE = 86400; // seconds
const UPLOAD_DIR = 'uploads';
const DB_CONFIG = {
  HOST: 'localhost',
  PORT: 27017,
  DB: 'christie_db',
};

const PORT = process.env.PORT || 8081;
const MORGAN_LOGLEVEL = 'dev';
const BASE_URL = 'http://localhost:8081/';
const CORS_OPTIONS = {
  origin: 'http://localhost:8080',
};

const STATUS_CODE = {
  SUCCESS: 0,
  GENERIC_FAILURE: 1,
  DB_FAILURE: 2,
  INVALID_INPUT: 3,
  UNAUTHORIZED_ACCESS: 4,
  RECORD_NOT_FOUND: 5,

  AUTH_USER_NOT_FOUND: 100,
  AUTH_INVALID_PASSWORD: 101,
  AUTH_REGISTER_VALIDATION_FAILURE: 102,
  AUTH_DUPLICATE_EMAIL: 103,

  IMAGE_NOT_FOUND: 200,
  IMAGE_INVALID_FILETYPE: 201,
};
export {
  ENV,
  JWT_SECRET,
  JWT_EXPIRE,
  UPLOAD_DIR,
  DB_CONFIG,
  PORT,
  MORGAN_LOGLEVEL,
  BASE_URL,
  CORS_OPTIONS,
  STATUS_CODE,
};
