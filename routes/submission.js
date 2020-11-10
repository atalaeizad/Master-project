var express = require('express');
var passport = require('passport');
var Account = require('../models/Account');
var auth = require('../controllers/auth')
var router = express.Router();
var SubmissionModel = require('../models/SubmissionModel');
var SubmissionInfoModel = require('../models/SubmissionInfoModel');
var MetaDataFileModel = require('../models/MetaDataFileModel');
var MetaDataInformationModel = require('../models/MetaDataInformationModel');
var RawFileModel = require('../models/RawFileModel');


var modify_controller = require('../controllers/modifycontroller');

//router.get('/', submission_controller.getSearch);

router.get('/', ensureAuthenticated, async function (req, res) {
    res.render('submissionDetails/submissionPanel', {
        submissions: await SubmissionInfoModel.find({
            userId: req.user._id
        }),
        user: req.user 
    });
});

router.get('/:id',ensureAuthenticated, async function (req, res) {
    res.render('submissionDetails/modifyFile', {
        submissionId: req.params.id,
        user: req.user 
    });
});

router.post('/:id', ensureAuthenticated, modify_controller.postUpload);



// test authentication
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login');
  } 
// router.post('/', search_controller.postSearch);

// router.post('/download', search_controller.downloadResults);

// router.post('/downloadSearchResult', search_controller.downloadSearchResult)

// router.get('/deleteData', search_controller.deleteData)

// router.get('/clearAll', search_controller.clearAll)

module.exports = router;