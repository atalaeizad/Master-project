var express = require('express');
var router = express.Router();

var search_controller = require('../controllers/searchcontroller');

router.get('/', search_controller.getSearch);

router.post('/', search_controller.postSearch);

router.post('/download', search_controller.downloadResults);

router.post('/downloadSearchResult', search_controller.downloadSearchResult)

router.get('/deleteData', search_controller.deleteData)

router.get('/clearAll', search_controller.clearAll)

module.exports = router;
