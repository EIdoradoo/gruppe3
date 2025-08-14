const pgsql = require('./db');
const express = require('express');
const ejs = require('ejs');

/**
 * - GET /logs
 * @type {import('express').Router}
 */
const router = express.Router();

/**
 * Loggt ein Ereignis in die Datenbank.
 *
 * @param {string} message - Lognachricht
 * @param {string} userip - IP-Adresse des Benutzers
 * @param {Object|null} metadata - Zusätzliche Daten (optional)
 * @returns {Promise<number>} ID des Log-Eintrags
 */
async function logToDatabase(message, userip, metadata = null) {
  const insertResult = await pgsql.query(
    `INSERT INTO logs (timestamp, message, ip, metadata)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [
      new Date(),
      message,
      userip,
      metadata,
    ]
  );

  return insertResult.rows[0].id;
}

/**
 * @param {string} source (Optional) the site, which logs should be shown
 * @returns {Promise<any[]>} all log-table rows
 */
async function getLog(source = "all") {
  if (source !== 'all') {
    let log = await pgsql.query('SELECT * FROM logs WHERE source = $1', [source]);
    if (log.rowCount === 0) {
      console.warn(`No logs for '${source}' found`);
    }
    return log.rows;
  }

  let log = await pgsql.query('SELECT * FROM logs');
  return log.rows;
}

// API Routes
router.get('/logs', async (req, res) => {
  let logData = await getLog();
  res.render('log', { data: logData });
});

module.exports = {
  logToDatabase,
  getLog,
  router
};
