var express = require('express');
var passport = require('passport');
var Account = require('../models/Account');
var auth = require('../controllers/auth')
var router = express.Router();


router.get('/', function (req, res) {
    res.render('index', { user : req.user });
});

router.get('/register', function(req, res) {
    res.render('register', { });
});


//router.get('/login', function(req, res) {
    //res.render('login', { user : req.user });
//});

//router.post('/login', passport.authenticate('local'), function(req, res) {
   // res.redirect('/');
//});
router.get('/user', ensureAuthenticated, function(req, res){
  res.render('user', { user: req.user });
});

router.get('/auth/orcid',
  passport.authenticate('orcid'));

router.get('/auth/orcid/callback', 
  passport.authenticate('orcid', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/user');
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