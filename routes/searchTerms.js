var express = require('express');
var router = express.Router();

var searchTerms_controller = require('../controllers/searchtermscontroller');

router.get('/', searchTerms_controller.getSearchTerms);

router.post('/edit', searchTerms_controller.editSearchTerm);

router.post('/delete', searchTerms_controller.deleteSearchTerm);

router.get('/add', searchTerms_controller.getSearchTerms);

router.post('/add', searchTerms_controller.addSearchTerm);



module.exports = router;
