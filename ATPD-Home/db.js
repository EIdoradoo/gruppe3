const { Pool } = require('pg');

const DB_USER = "m15_22_2310_group3";
const DB_PASS = "_La_qrxSY26UxJzSfK4B";
const DB_HOST = "dl-datenbank";
const DB_PORT = 5432;
const DB_NAME = "m15_22_2310_group3";

/**
 * @type {import('pg').Pool}
 */
const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASS,
  port: DB_PORT,
});

/**
 * @type {import('pg').Pool}
 */
module.exports = pool;
