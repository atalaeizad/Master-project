var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const fileUpload = require('./lib/index');
const bodyParser = require('body-parser');
const request = require('request');

const models = require('./models');
var passport = require('passport');
//var LocalStrategy = require('passport-local').Strategy;
var OrcidStrategy = require('passport-orcid').Strategy;
var indexRouter = require('./routes/index');
var uploadRouter = require('./routes/upload');
var searchRouter = require('./routes/search');
var searchTermsRouter = require('./routes/searchTerms');
var usersRouter = require('./routes/user');
var submissionRouter = require('./routes/submission');

var app = express();
app.locals.moment = require('moment');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use('/api/jokes', require('./crud')(models.Jokes))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'downloads')));

app.use('/', indexRouter);
//app.use('/questions', indexRouter),
app.use('/user', usersRouter);
app.use('/upload', uploadRouter);
app.use('/search', searchRouter);
app.use('/searchTerms', searchTermsRouter);
app.use('/submission', submissionRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {errordetails: err});
});

module.exports = app;

// Initial Config
const port = process.env.PORT || 3000;

// Server
var server = app.listen(port, () => console.log(`Listening on port ${port}`));
server.setTimeout(500000);
