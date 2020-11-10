var express = require('express');
const app = express();

const fs = require('fs');
const path = require('path');
const moment = require('moment');
var mongoose = require('mongoose');

const uuidv1 = require('uuid/v1');
var zipHelper = require('../helpers/zipHelper');

const { Parser } = require('json2csv');

var SubmissionModel = require('../models/SubmissionModel');
var SubmissionInfoModel = require('../models/SubmissionInfoModel');
var MetaDataFileModel = require('../models/MetaDataFileModel');
var MetaDataInformationModel = require('../models/MetaDataInformationModel');
var RawFileModel = require('../models/RawFileModel');
var SearchResultModel = require('../models/SearchResultModel');
var SearchTermModel = require('../models/SearchTermModel');
var MetricsModel = require('../models/Metric');
//get delete page
exports.deleteData = function(req, res) {
  res.render('clearDatabase', {error: null, user: req.user});
};
// drop MetaDataInformation Collection (For testing only)
exports.clearAll = function(req, res) {
  MetaDataInformationModel.collection.drop();
  SubmissionModel.collection.drop()
  SubmissionInfoModel.collection.drop();
  MetaDataFileModel.collection.drop();
  RawFileModel.collection.drop();
  MetricsModel.collection.drop();
  
  getEnabledSearchTerms().then( function (searchTermList) {
    res.render('search', {searchResult: null, searchTerms: searchTermList, error: null, user: req.user});    
  })
};

async function getEnabledSearchTerms() {
  let terms = await SearchTermModel.find({Enabled: true});
  return terms;
}

// get search page
exports.getSearch = function(req, res) {
  getEnabledSearchTerms().then( function (searchTermList) {
    res.render('search', {searchResult: null, searchTerms: searchTermList, error: null, user: req.user});    
  })
};

// get search result 
exports.postSearch = function(req, res, next) {
  //console.log(req.body);
  extractSearchQueryFromReq(req.body).then(function (query) {
    var columns = '_id rawFileId genus specificepithet infraspecificepithet sex lifestage patch url';
    //console.log(query);
    MetaDataInformationModel.find(query, columns, async function(err, metaDatas){
      if(err){
        console.log("Error retrieving meta data information from DB: " + err);
      } else{
        var searchResultIns = {};
        searchResultIns._id = mongoose.Types.ObjectId();
  
        var results = [];
        var resultsSigList = [];
        var ids = [];
        var resultMetadats =[];
        for (var metaRow of metaDatas)
        {
          resultMetadats.push(getSearchRowSignature(metaRow));
        }


        for(var metaData of metaDatas){
          // push id into ids list 
          console.log("ids are:" + metaData._id);
          ids.push(metaData._id);
          
          var sig = getSearchRowSignature(metaData);
          var count = resultMetadats.filter(x => x === sig).length;
          if(resultsSigList.indexOf(sig) === -1){
            // create result object and fill metadata info
            var result = {};
            result.SearchResultId = searchResultIns._id;
            result.TotalSearchResultCount = metaDatas.length;
            result._id = metaData._id;
            result.rawFileId = metaData.rawFileId;
            result.genus = metaData.genus;
            result.specificepithet = metaData.specificepithet;
            result.infraspecificepithet = metaData.infraspecificepithet;
            result.sex = metaData.sex;
            result.lifestage = metaData.lifestage;
            result.patch = metaData.patch;
            result.count = count;
            //var rFile = await RawFileModel.findById(metaData.rawFileId);
            //result.url = path.resolve(path.normalize(rFile.path));
  
            results.push(result);
            resultsSigList.push(sig);
          }      
        }
  
        //save ids in search result
        searchResultIns.MetaDataInformationIds = ids;
  
        // save search result
        SearchResultModel.create(searchResultIns, function (err, searchResult_instance) {
          if (err){
            console.log("SearchResult save ERROR! " + err);
            return false;
          }
        });
  
        var ret = JSON.stringify(results);
        
        getEnabledSearchTerms().then( function (searchTermList) {
          res.render('search', {searchResult: results, searchTerms: searchTermList, error: null, user: req.user});
          //console.log('retrieved meta data information', ret);
          return;   
        })
      }
    });    
  });
};

function getSearchRowSignature(row) {
  if(row!=undefined && row != ""){
    return row.genus + row.specificepithet + row.infraspecificepithet + row.sex + row.lifestage + row.patch;
  }
}

// download search result
exports.downloadSearchResult = function(req, res, next) {
  
  SearchResultModel.findOne({ _id: req.body.SearchResultId }, async function(err, searchResult){
    if(err){
      console.log("Error retrieving search result from DB: " + err);
    } else{
    //console.log(req.body);
      var rand = uuidv1();

      //var metaDataIdsList2 = JSON.parse(req.body.ids);
      var metaDataIdsList = searchResult.MetaDataInformationIds;
      
      MetaDataInformationModel.find({ _id: { $in : metaDataIdsList }}, async function(err, metaDatas){
        if(err){
          console.log("Error retrieving meta data information from DB: " + err);
        } else{

          // create lists of allIds of raw files and submission infos corresponding to requested meta data file
          var rawFileUrls = [];
          var submissionInfoIds = [];
          var submissionInfos = [];

          for(var metaData of metaDatas){
            // get raw file corresponding to this data row
            var rFile = await RawFileModel.findById(metaData.rawFileId);
            rawFileUrls.push(path.resolve(path.normalize(rFile.path)));
            metaData.rawFileName = rFile.name;
            
            // get submission corrsponding to this data row
            var submission = await SubmissionModel.findById(rFile.submissionId);
            metaData.submissionInfoId = submission.submissionInfoId;
            if (submissionInfoIds.indexOf(submission.submissionInfoId) === -1) {
              submissionInfoIds.push(submission.submissionInfoId);

              var submissionInfo = await SubmissionInfoModel.findById(submission.submissionInfoId);
              submissionInfos.push(submissionInfo); 
            }
          }
          
          // submission info data file location
          var submissionInfoFileLocation = 'downloads/submissionInfo' + '-' + rand + '.csv';
            
          // generate submission info file content (json to csv)
          var submissionInfoFileContent = generateSubmissionInfoFileContent(submissionInfos); 

          // write submission info content to file
          fs.writeFileSync(submissionInfoFileLocation, submissionInfoFileContent);

          // meta data file location
          var metaFileLocation = 'downloads/metaData' + '-' + rand + '.csv';

          // generate meta data file content (json to csv)
          var metaDataFileContent = generateMetaFileContent(metaDatas); 

          // write meta data to meta data file
          fs.writeFile(metaFileLocation, metaDataFileContent, 'utf8', function (err) {
            if (err) {
              console.log('Some error occured - file either not saved or corrupted file saved.');
            } else{
              console.log('Meta Data file saved!');

              // add submission info file to files list 
              rawFileUrls.push(submissionInfoFileLocation);

              // add meta data file to files list 
              rawFileUrls.push(metaFileLocation);

              //Zip all raw files with meta data file and submission info file
              var zipFile = zipHelper.zip(rawFileUrls);  

              //send file to user
              res.set('Content-Type','application/zip');
              //var stat = fs.statSync(zipFile);
              res.setHeader('Content-Disposition', 'attachment; filename='+path.resolve(path.normalize(zipFile)));
              //res.setHeader("Content-Length",stat.size);
              res.download(path.resolve(path.normalize(zipFile)), function (err) {
                if (err) {
                  // Handle error, but keep in mind the response may be partially-sent
                  // so check res.headersSent
                  console.log("download error " + err);
                } else {
                  // decrement a download credit, etc.
                }
              });
            }
          });      
        }
      });
    }
  });
};


// TODO: Move to database 
const searchTerms = ["institutioncode",
"collectioncode",
"cataloguenumber",
"class",
"order",
"family",
"genus",
"infraSpecificepithet",
"specificepithet",
"sex",
"lifestage",
"country",
"patch"];

// helper methods
async function extractSearchQueryFromReq(reqBody) {
  var query = {};

  var searchTermsList = await SearchTermModel.find({Enabled: true},'Name');
  searchTermsList = searchTermsList.map(x=>x.Name);

  for(var term of searchTermsList){
    var termVal = getSearchTermsFor(reqBody,term);
    if(Array.isArray(termVal)){
      termVal = termVal[0];
    }
    if(termVal!=null && termVal != ""){
      var termValsList = termVal.trim().split(' OR ').map(element => {
        //return '/'+element.toLowerCase().trim()+'/i';
        return new RegExp('\\b' + element.toLowerCase().trim() + '\\b', 'i');
      }).filter(function(e){return e});
      query[term] = { $in : termValsList };
    }
  }

  return query;
}

function getSearchTermsFor(reqBody,field){
  return reqBody[field] == null || reqBody[field] == "" ? null : reqBody[field];
}

function generateSubmissionInfoFileContent(submissionInfos) {
  const fields = [  'submissionId',
                    'recordId',
                    'researchId',
                    'metaDataCollectionId',
                    'typeOfData',
                    'dataForm',
                    'published',
                    'reference',
                    'doi',
                    'embargo',
                    'releaseDate',
                    'institute',
                    'name',
                    'email'];
  
  try {
    const parser = new Parser({ fields, quote: '' });
    const csv = parser.parse(submissionInfos);
    return csv;
  } catch (err) {
    console.error(err);
  }
}

function generateMetaFileContent(metaData) {
  const fields = [  
'submissionInfoId',
'rawFileName',
'recordid',
'genus',
'specificepithet',
'patch',
'lightangle1',
'lightangle2',
'probeangle1',
'probeangle2',
'replicate',
'uniqueid',
'institutioncode',
'cataloguenumber',
'collectioncode',
'field',
'class',
'order',
'family',
'infraSpecificepithet',
'sex',
'lifestage',
'country'];
  
  try {
    const parser = new Parser({ fields, quote: '' });
    var csv = parser.parse(metaData);
    return csv;
  } catch (err) {
    console.error(err);
  }
}

// WHAT IS THIS??!!
function generateMetaFile(metaDataIdsList) {
  var metaFile = generateMetaFile(metaDataIdsList);
  var rawFilesUrls = getRawFilesUrls(metaDataIdsList);
  var zipFile = zipFiles(metaFile,rawFilesUrls);  
  res.download(zipFile);
  var metaDataInformations = MetaDataInformationModel.find(metaDataIdsList, function (err, docs) { });
  return metaDataInformations;
}

// DOWNLOAD
// Deprecated Not Used Any more, use downloadSearchResult
exports.downloadResults = function(req, res, next) {
  //console.log(req.body);
  var rand = uuidv1();
  var metaDataIdsList = JSON.parse(req.body.ids);
  
  MetaDataInformationModel.find({ _id: { $in : metaDataIdsList }}, async function(err, metaDatas){
    if(err){
      console.log("Error retrieving meta data information from DB: " + err);
    } else{

      // create lists of allIds of raw files and submission infos corresponding to requested meta data file
      var rawFileUrls = [];
      var submissionInfoIds = [];
      var submissionInfos = [];

      for(var metaData of metaDatas){
        // get raw file corresponding to this data row
        var rFile = await RawFileModel.findById(metaData.rawFileId);
        rawFileUrls.push(path.resolve(path.normalize(rFile.path)));
        metaData.rawFileName = rFile.name;
        
        // get submission corrsponding to this data row
        var submission = await SubmissionModel.findById(rFile.submissionId);
        metaData.submissionInfoId = submission.submissionInfoId;
        if (submissionInfoIds.indexOf(submission.submissionInfoId) === -1) {
          submissionInfoIds.push(submission.submissionInfoId);

          var submissionInfo = await SubmissionInfoModel.findById(submission.submissionInfoId);
          submissionInfos.push(submissionInfo); 
        }
      }
      
      // submission info data file location
      var submissionInfoFileLocation = 'downloads/submissionInfo' + '-' + rand + '.csv';
        
      // generate submission info file content (json to csv)
      var submissionInfoFileContent = generateSubmissionInfoFileContent(submissionInfos); 

      // write submission info content to file
      fs.writeFileSync(submissionInfoFileLocation, submissionInfoFileContent);

      // meta data file location
      var metaFileLocation = 'downloads/metaData' + '-' + rand + '.csv';

      // generate meta data file content (json to csv)
      var metaDataFileContent = generateMetaFileContent(metaDatas); 

      // write meta data to meta data file
      fs.writeFile(metaFileLocation, metaDataFileContent, 'utf8', function (err) {
        if (err) {
          console.log('Some error occured - file either not saved or corrupted file saved.');
        } else{
          console.log('Meta Data file saved!');

          // add submission info file to files list 
          rawFileUrls.push(submissionInfoFileLocation);

          // add meta data file to files list 
          rawFileUrls.push(metaFileLocation);

          //Zip all raw files with meta data file and submission info file
          var zipFile = zipHelper.zip(rawFileUrls);  

          //send file to user
          res.set('Content-Type','application/octet-stream');
          var stat = fs.statSync(zipFile);
          res.setHeader('Content-Disposition', 'attachment; filename='+path.resolve(path.normalize(zipFile)));
          res.setHeader("Content-Length",stat.size);
          res.download(path.resolve(path.normalize(zipFile)), function (err) {
            if (err) {
              // Handle error, but keep in mind the response may be partially-sent
              // so check res.headersSent
              console.log("download error " + err);
            } else {
              // decrement a download credit, etc.
            }
          });
        }
      });      
    }
  });
};