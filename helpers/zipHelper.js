var express = require('express');
const path = require('path');

const fs = require('fs');
const app = express();

const uuidv1 = require('uuid/v1');
 
 var AdmZip = require('adm-zip');

var zip = new require('node-zip')();


const rawFilesLocation = path.dirname(__dirname) + '/uploads/raw/';

exports.getFileNamesInZip = function(fileUrl) {
  var zip = new AdmZip(fileUrl);
  
  var zipEntries = zip.getEntries().map(function(entry) {
  	return entry.entryName;
  });

  return zipEntries;
}

exports.unzip = function(fileUrl){
  var zip = new AdmZip(fileUrl);
  var rand = uuidv1();
  //console.log(rand);
  var folder = rawFilesLocation + path.basename(fileUrl) + '-' + rand + '/';
  //console.log(folder);
  
	zip.extractAllTo(folder, true);

	return folder;
}

// get all filse within folder (for testing only)
exports.get_files = function(folder) {
  let filenames = [];

  fs.readdirSync(folder).forEach(file => {
    filenames.push(path.resolve(path.normalize(folder+file)));
  });

  return filenames;
}

//get all files recursively
exports.getAllFiles = function(dirPath) {
  var arrayOfFiles = [];
  files = fs.readdirSync(dirPath);
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayFile = getsubFiles(dirPath + "/" + file);
      arrayOfFiles.push(...arrayFile);
    } else {
      arrayOfFiles.push(path.join( dirPath, "/", file));
    }
  });
 
  return arrayOfFiles;
}

getsubFiles = function(folderPath)
{
  var arrayOfFilessub=[];
  filessub = fs.readdirSync(folderPath);
  filessub.forEach(function(file1) {
      arrayOfFilessub.push(path.join(folderPath, "/", file1));
  });
 
  return arrayOfFilessub;
}


exports.zip = function(fileUrls){
  /*var zip = new require('node-zip')();

  for(var file of fileUrls){
    var fn = path.basename(file);
    zip.file(fn,fs.readFileSync(file));
  }
  var data = zip.generate({base64:true,compression:'DEFLATE'});

  //return data;
  
  var rand = uuidv1();
  var zipFileUrl = 'downloads/researchData'+ rand + '.zip';
  fs.writeFileSync(zipFileUrl, data, 'binary');
  return zipFileUrl;*/

  //creating archives
  var zip = new AdmZip();
  var rand = uuidv1();

  for(var file of fileUrls){
    // add local file
    try{
      if (fs.existsSync(file)) {
        //file exists
        zip.addLocalFile(file); 
      }
    } catch(err) {
      console.error(err)
    }     
  }
  //
  // var willSendthis = zip.toBuffer();
  // return willSendthis;
  // or write everything to disk
  var zipFileUrl = 'downloads/researchData'+ rand + '.zip';
  zip.writeZip(zipFileUrl);
  return zipFileUrl;
}