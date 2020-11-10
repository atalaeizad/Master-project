var express = require('express');
var passport = require('passport');
var router = express.Router();
var Account = require('../models/Account');
var auth = require('../controllers/auth')
var email_controller = require('../controllers/email');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { user: req.user });
});
router.get('/login', function(req, res){
  res.render('login');
});

router.get('/about', function(req, res, next) {
  res.render('about', { user: req.user });
});

router.get('/questions', function(req, res, next) {
  res.render('questions', { user: req.user });
});

router.get('/template', function(req, res, next) {
  res.render('template', { user: req.user });
});

router.get('/contact', function(req, res, next) {
  res.render('contact', { user: req.user });
});

router.post('/contact', email_controller.postEmail);

router.get('/team', function(req, res, next) {
  res.render('team' ,{ user: req.user });
});

router.get('/partners', function(req, res, next) {
  res.render('partners' ,{ user: req.user });
});

router.get('/user', ensureAuthenticated, function(req, res){
  res.render('user', { user: req.user });
});




router.get('/auth/orcid',
  passport.authenticate('orcid'));

router.get('/auth/orcid/callback', 
  passport.authenticate('orcid', { failureRedirect: '/auth/orcid' }),
  function(req, res) {
    res.redirect('/');
  });

  router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/ping', function(req, res){
    res.status(200).send("pong!");
});

// test authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}



module.exports = router;