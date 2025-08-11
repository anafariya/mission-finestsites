require('dotenv').config();
const express = require('express');
const api = require('./api');
const path = require('path');
const config = require('config');
const cors = require('cors');
const mongo = require('./model/mongo');
const mongoSanitize = require('express-mongo-sanitize');
const throttle = config.get('throttle');
const limiter = require('express-rate-limit');
const i18n = require('i18n');
require('./helper/i18n').config(); // helper file
require('./cronjob/group-event');

const port = process.env.PORT || 5001;
const app = express();

app.use(i18n.init)
// cors
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.MISSION_CONTROL_CLIENT,
];

const opts = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(opts));
app.options("*", cors(opts));

// config express
app.use(express.json());
app.set('trust proxy', 1); // rate limit proxy
app.use(express.urlencoded({ extended: true }));

// mongo sanitise 
app.use(mongoSanitize());

// api with rate limiter
app.use('/api/', limiter(throttle.api));
app.use(api);

// serve static files in production
if (process.env.NODE_ENV === 'production'){

  app.use(express.static(path.join(__dirname, 'client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/client/dist/index.html'))
  });
}

// error handling
app.use(function(err, req, res, next){

  let message = null;

  if (err.raw){

    message = err.raw.message;

  }
  else if (err.message){

    message = err.message;

  }
  else if (err.sqlMessage){

    message = err.sqlMessage;

  }

  console.error(err);

  message ?
    res.status(500).send({ message: message }) :
    res.status(500).send(err);

});

// start server
const server = app.listen(port, async () => {

  const welcome = () => console.log('Welcome to Gravity Mission Control 🕹')
  await mongo.connect();
  welcome('de529c70-eb80-4dfb-9540-5075db7545bf')


});

module.exports = server;




