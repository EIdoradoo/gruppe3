const express = require('express');
const path = require('path');
const compression = require('compression');

const api_yuumibook_read = require('./api-yuumibook-read');
const api_yuumibook_write = require('./api-yuumibook-write');
const api_logger = require('./api-logger');

const app = express();
const PORT = 3001;

app.use(compression()); // Compress all routes

// route to index.html
app.get('/', (req, res) => { res.redirect('index.html'); });

// allows to auto-route to the files inside 'public' folder (e.g. public/css/main.css)
app.use(express.static(path.join(__dirname, 'public')));

// EJS als View-Engine setzen
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// use JSON Parser
app.use(express.json());

// import different backend APIs of the modules
app.use(api_yuumibook_read);
app.use(api_yuumibook_write.router);
app.use(api_logger.router);

// Middleware (set CORS to *)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { return res.sendStatus(200); }
  next();
});

// 404-Handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server runs: http://localhost:${PORT}`);
});
