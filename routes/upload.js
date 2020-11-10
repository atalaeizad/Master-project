var express = require('express');
var passport = require('passport');
var Account = require('../models/Account');
var auth = require('../controllers/auth')
var router = express.Router();

var upload_controller = require('../controllers/uploadcontroller');

router.get('/startUpload', ensureAuthenticated, upload_controller.startUpload);

router.get('/', ensureAuthenticated, upload_controller.getUpload);

router.post('/', ensureAuthenticated, upload_controller.postUpload);

// test authentication
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login');
  } 

/*router.get('/startUpload', upload_controller.startUpload);

router.get('/', upload_controller.getUpload);

router.post('/', upload_controller.postUpload);
*/
module.exports = router;

