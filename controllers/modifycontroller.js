var express = require('express');
const app = express();
//const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
var mongoose = require('mongoose');
const _ = require('lodash');
const escapeHtml = require('escape-html');

var uploadHelper = require('../helpers/uploadHelper');
var verifyHelper = require('../helpers/dataVerificationHelper');
var zipHelper = require('../helpers/zipHelper');
var sendEmail = require('../helpers/sendEmail');

const Metric = require('../models/Metric');

var SubmissionModel = require('../models/SubmissionModel');
var SubmissionInfoModel = require('../models/SubmissionInfoModel');
var MetaDataFileModel = require('../models/MetaDataFileModel');
var MetaDataInformationModel = require('../models/MetaDataInformationModel');
var RawFileModel = require('../models/RawFileModel');


  
  var userEmail = "";
  var name = "";

exports.postUpload = function(req, res, next) {
    var report = [];
    userEmail = req.body.email;
    setEmbargo = req.body.dataEmbargo;
    name = req.body.fname + " " + req.body.lname;
    var submissionId = req.body['submissionId'];
    //let uploadSet={};
    // verify request parameters 
    err = {};
    if(!verifyHelper.verifyUploadRequest(req,err)){
      res.status(403).send("No files were uploaded! Error Occured:VUR " + err.details);
      return;
    }

    // set submissionInfo object from request paramters
    //var subInfos = getSubmissionInfo(submissionId);

    // getSubmissionInfo().then( function (subInfo) {


    // })
    // SubmissionInfoModel.find({ submissionId: submissionId}, function(err, sInfo){
    //     if(err) {
    //         console.log(err);
    //         return
    //     }
    //     else{   
            
        getSubmissionInfo(submissionId, function(err, sInfo) {
            if (err) {
              console.log(err);
            }
          
                //return sInfo
            
            //var submissionInfos = tojson(sInfo);
            
            let uploadSet = createUploadObjectsSet(sInfo, submissionId);

        
            // upload meta file to server
            // TODO: metafile path not present in schema? extract and delete?
            uploadSet.metaFile.path = uploadHelper.uploadFileToServer(req.files.metaFile, function(err) {
            if (err){
                console.log("Error with meta file upload!"); 
                
                res.status(403).send("No files were uploaded! Error Occured: meta " + err.details);
                return;
            }
            //console.log("dataFrom :" +uploadSet.submissionInfo.dataFrom);
            // Do meta file header validations here
            console.log("datafrom:" +sInfo.dataFrom);
            var metaFieldsError = {};
            if (!verifyHelper.modifyVerifyMetaFileHeaderFields(uploadSet.submissionInfo.dataFrom,uploadSet.metaFile.path,metaFieldsError)){
                console.log("Error with meta file header!"); 
                report.push(metaFieldsError.details);
                res.status(403).send("No files were uploaded! Error Occured: " + metaFieldsError.details);
                return;
            }
        
            // Validate that all meta file rows contain All required values
            // verify that all required fields for this template exist in every row
            var metaDataRowsError = {};
            uploadSet.metaDetaInformations = verifyHelper.modifyVerifyAndGetMetaDataRows(uploadSet.metaFile.path,uploadSet.submissionInfo.dataFrom,metaDataRowsError);
        
            if(!uploadSet.metaDetaInformations){
                console.log("Error with meta files raw file value !"); 
                report.push(metaDataRowsError.details);
                //res.status(403).send("No files were uploaded! Error Occured: " + metaDataRowsError.details);
                //return;
            }
        
                // upload raw file to server 
                uploadSet.rawFile.path = uploadHelper.uploadFileToServer(req.files.rawFile,function(err) {
                    if (err){
                    console.log("Error with raw file upload!"); 
                    res.status(403).send("No files were uploaded! Error Occured: raw" + err.details);
                    return;
                    }
                    
                    // validate that raw files in zip file and the meta file rows match, 
                    // use this function to get list of raw files in zip:
                    //var rawFileNamesInZip = zipHelper.getFileNamesInZip(uploadSet.rawFile.path);
                    //console.log(rawFileNamesInZip);
                    var rawFolderPath = zipHelper.unzip(uploadSet.rawFile.path);
                    console.log("file path:" + rawFolderPath);
                    ///Extract raw file from zip----------------------------------------
                    //var rawFilesInZip = zipHelper.get_files(rawFolderPath);
                    var rawFilesInZip = zipHelper.getAllFiles(rawFolderPath);
            
                    // extract all raw files from zip
                    rawFilesInZip.forEach(function(zipEntry) {
                    console.log("all files" + zipEntry);
                    }); 
            
                    // if(rawFilesInZip.length!= uploadSet.metaDetaInformations.length){
                    // var number= "Number of Raw Files does not match number of rows in meta file!";
                    //   report.push(number);
                    // }
            
                    ///match metadata filename column with raw files name
                    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    var modifyMetaDetaInformations = verifyHelper.getMetaDataRows(uploadSet.metaFile.path,uploadSet.submissionInfo.dataFrom,metaDataRowsError);
                    missingMetaInfo = [];
                    for (const rawFilex of rawFilesInZip) {
                        var rawFileNamex = path.basename(rawFilex);
                        //console.log(rawFileNamex);
                        // get meta row from meta file corresponding to this file
                        var metaDatax = modifyMetaDetaInformations.find(obj => {
                            return rawFileNamex.includes(obj.filename.trim());
                        });
                        //console.log(metaDatax);
                
                        // if(metaData == undefined || metaData==null){
                        //   res.status(403).send("No files were uploaded! Error Occured: Raw File " + rawFileName + " does not match any row in meta file!");
                        //   return;
                        // }
                        if(metaDatax == undefined || metaDatax==null){
                            missingMetaInfo.push(rawFileNamex + " ");
                        }
                    }
                    errorRaw="";
                    if(missingMetaInfo.length > 0){
                        //res.status(403).send("Raw File Error, No metadata found in metadata file for raw files:  " + missingMetaInfo.join());
                        errorRaw=("Raw File Error, No metadata found in metadata file for raw files:  " + missingMetaInfo.join());
                        //return;
                        report.push(errorRaw);
                    }
                    if (report.length >0){
                        res.status(403).send("No files were uploaded to the repository! Error Occured. " +  report.join());
                        return;
                    }
            
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    // Map raw files to meta rows and create a MetadataInformation and a raw file object for each mapping 
                    for (const rawFile of rawFilesInZip) {
                    //console.log(rawFile);
                        var rawFileName = path.basename(rawFile);
                        
                        // get meta row from met file corresponding to this file
                        var metaData = uploadSet.metaDetaInformations.find(obj => {
                            //console.log(obj.filename);
                            return rawFileName.includes(obj.filename.trim());
                        });
                
                        // if(metaData == undefined || metaData==null){
                        //   //res.status(403).send("No files were uploaded! Error Occured: Raw File " + rawFileName + " does not match any row in meta file!");
                        //   //return;
                        //   errorRawMeta = ("No files were uploaded! Error Occured: Raw File " + rawFileName + " does not match any row in meta file!");
                        //   report.push(errorRawMeta);
                        // }
                
                
                        // create raw file object
                        var rawF = {};
                        rawF._id = mongoose.Types.ObjectId();
                        rawF.submissionId = submissionId;
                        // rawF.name = rawFileName;
                        rawF.name = metaData.filename;
                        // TODO: confirm with client that this is the meaning of type here
                        rawF.type =  uploadSet.submissionInfo.typeOfData;
                        rawF.path = rawFile;
                        uploadSet.rawFiles.push(rawF);
                
                        // set metadataobject rawFileId to created rawFileID
                        metaData.rawFileId = rawF._id; 
                        metaData.metaDataFileId = uploadSet.metaFile._id; 
                    }
            
                    // if(setEmbargo == true){
                    // res.send("Data Uploaded Successfully! But won't be released until specified embargo Date!");
                    // return;
                    // }
            
                    
            
                    // Save complete dataset to DB
                    if (saveUploadObjectsToDB(uploadSet,submissionId)){
                        console.log("till this point everything its okay");
                        var metricsResultsList = calculateMetrics(uploadSet, rawFolderPath);
                        //res.send("Data Uploaded Successfully! Metrics calculation is on proccess. Confirmation Email will be sent soon!");
                        let response = "Data Modification is successful";
                        res.render('submissionDetails/modifyFile', {error: null, user: req.user , message: response});
                        //res.render(path.resolve(__dirname + "/views/index"));
                        //res.render('upload', {filelist: filenames, moment: moment, error: null, user: req.user, uploadInfo: uploadSet.submissionInfo });
                    }
                    else
                    {

                        res.status(403).send("No files were uploaded! Error Occured ");
                    }
                
                    return;
                });
            });  
        });
    //     }    
    // });
 };

async function calculateMetrics(uploadSet, rawFolderPath){

    let result = await Metric.fromRawFile(uploadSet,rawFolderPath);
    //console.log(result);
    result.metrics.map(m => m.save());
    return result;

}





function createUploadObjectsSet(subInfo,submissionId) {
  let uploadSet = {};
  // create submission object and set all ids 
        uploadSet.submission = {};
        uploadSet.submission._id = mongoose.Types.ObjectId(submissionId);

        uploadSet.metaFile = {};
        uploadSet.metaFile._id = mongoose.Types.ObjectId();
        uploadSet.metaFile.submissionId =uploadSet.submission._id;

        uploadSet.metaDetaInformations = [];

        uploadSet.rawFile = {};
        uploadSet.rawFile._id = mongoose.Types.ObjectId();
        uploadSet.rawFile.submissionId = submissionId;

        uploadSet.rawFiles = [];

        uploadSet.submissionInfo = subInfo;
        //   uploadSet.submissionInfo._id = mongoose.Types.ObjectId();
        //   uploadSet.submissionInfo.submissionId =submissionId;

        // set all ids into submission  
        uploadSet.submission.submissionInfoId = uploadSet.submissionInfo._id;
        uploadSet.submission.rawFileId = uploadSet.rawFile._id;
        uploadSet.submission.metaDataFileId = uploadSet.metaFile._id;

    return uploadSet;
}

function saveUploadObjectsToDB(uploadSet, sId) {

    MetaDataFileModel.create(uploadSet.metaFile, function (err, metaFile_instance) {
        if (err) {
        console.log("metaFile save ERROR! " + err);
        return false;
        }
    });

    for (var i = uploadSet.rawFiles.length - 1; i >= 0; i--) {
        rawF = uploadSet.rawFiles[i];
        RawFileModel.create(rawF, function (err, rawFile_instance) {
        if (err){
            console.log("rawFile save ERROR! " + err);
            return false;
        }
        });
    }

    for (var i = uploadSet.metaDetaInformations.length - 1; i >= 0; i--) {
        metaDataRow = uploadSet.metaDetaInformations[i];
        if((metaDataRow.oldfilename == null || metaDataRow.oldfilename == "") && metaDataRow.filename !== null)
        {
            MetaDataInformationModel.create(metaDataRow, function (err, metaDataInformation_instance) {
                if (err){
                    console.log("metaDataRow save ERROR! " + err);
                    return false;
                }
                });
        }
        else if (metaDataRow.oldfilename !== null && ( metaDataRow.filename == "" || metaDataRow.filename == null))
        {

            MetaDataInformationModel.deleteOne({ submissionId: sId, filename: metaDataRow.oldfilename }, function (err, metaDataInformation_instance) {
                if (err){
                    console.log("metaDataRow delete ERROR! " + err);
                    return false;
                }
                else 
                {
                    console.log("Deleted file is: "+metaDataInformation_instance);
                }
            });

        }
        else if(metaDataRow.oldfilename !== null && metaDataRow.filename !== null)  
        {

            //var rawFileId = getSubmissionInfo(sId);

            MetaDataInformationModel.deleteOne({ submissionId: sId, filename: metaDataRow.oldfilename }, function (err, metaDataInformation_instance) {
                if (err){
                    console.log("metaDataRow delete ERROR! " + err);
                    return false;
                }
               
            });
            MetaDataInformationModel.create(metaDataRow, function (err, metaDataInformation_instance) {
                if (err){
                    console.log("metaDataRow save ERROR! " + err);
                    return false;
                }
            });

            //MetaDataInformationModel.findOne({nick: 'noname'}).then(err, result) {console.log(result)};

        }

    }

  return true;
}

// TODO: move to helper?
function extractSubmissionInfoFrom(requestBody){
  let submissionInfo = {};

  // TODO: Extract All parameters 
  submissionInfo.name = requestBody.name;
  submissionInfo.email = requestBody.email;
  submissionInfo.institute = requestBody.institute;

  submissionInfo.typeOfData = requestBody.dataType;
  submissionInfo.dataFrom = requestBody.dataFrom;
  submissionInfo.published = requestBody.dataPublished;
  submissionInfo.reference = requestBody.reference;
  submissionInfo.doi = requestBody.doi;
  submissionInfo.embargo = requestBody.dataEmbargo;
  submissionInfo.releaseDate = requestBody.embargoDate;

  return submissionInfo; 
}
function extractSubmissionInfo(requestBody){
  let submissionInfo = {};

  // TODO: Extract All parameters 
  submissionInfo.name = requestBody.name;
  submissionInfo.email = requestBody.email;
  submissionInfo.institute = requestBody.institute;

  submissionInfo.typeOfData = requestBody.dataType;
  submissionInfo.dataFrom = requestBody.dataFrom;
  submissionInfo.published = requestBody.dataPublished;
  submissionInfo.reference = requestBody.reference;
  submissionInfo.doi = requestBody.doi;
  submissionInfo.embargo = requestBody.dataEmbargo;
  submissionInfo.releaseDate = requestBody.embargoDate;
  submissionInfo.userId = requestBody.userId ;
  submissionInfo.submissionId = requestBody.submissionId;

  return submissionInfo; 
}
//  function getSubmissionInfo(sId) {
//      var subInfo;
//     //let terms = await SearchTermModel.find({Enabled: true});
//      SubmissionInfoModel.find({ submissionId: sId}, function(err, sInfo){
//         if(err) {
//           console.log(err);
//           return
//         }
//         subInfo=sInfo;
//     });
//     console.log("doc is:"+subInfo);
//     return subInfo;
// }

  async function getRawFile(subId, filename) {
    let rawDetails = await RawFileModel.findOne({submissionId: subId, name: filename});
    let id = rawDetails._id; 
    return id;
  }

  function getSubmissionInfo(sId,callback) {
      SubmissionInfoModel.find({ submissionId: sId}, function(err, subInfo) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, subInfo[0]);
        }
      });     
        
  }

//   function retrieveSubInfo(uname, callback) {
//     User.find({uname: uname}, function(err, users) {
//       if (err) {
//         callback(err, null);
//       } else {
//         callback(null, users[0]);
//       }
//     });
//   };
