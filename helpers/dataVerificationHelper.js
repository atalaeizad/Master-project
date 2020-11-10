var express = require('express');
const path = require('path');

const fs = require('fs');
const app = express();

const reflectance_museum_header_fields = [
  "filename",
  "institutioncode",
  "cataloguenumber",
  "genus",
  "specificepithet",
  "patch",
  "lightangle1",
  "lightangle2",
  "probeangle1",
  "probeangle2",
  "replicate"
  ];

const reflectance_field_header_fields = [
  "filename",
  "uniqueid",
  "genus",
  "specificepithet",
  "patch",
  "lightangle1",
  "lightangle2",
  "probeangle1",
  "probeangle2",
  "replicate"
  ];
  const modify_reflectance_museum_header_fields = [
    "oldfilename",
    "filename",
    "institutioncode",
    "cataloguenumber",
    "genus",
    "specificepithet",
    "patch",
    "lightangle1",
    "lightangle2",
    "probeangle1",
    "probeangle2",
    "replicate"
    ];
  
  const modify_reflectance_field_header_fields = [
    "oldfilename",
    "filename",
    "uniqueid",
    "genus",
    "specificepithet",
    "patch",
    "lightangle1",
    "lightangle2",
    "probeangle1",
    "probeangle2",
    "replicate"
    ];
  

exports.verifyUploadRequest = function(req,err) {
  // verify request has exactly 2 files
  if (!req.files || Object.keys(req.files).length != 2) {
  	err.details = "Wrong number of files selected!"
    return false;
  }

  // verify request has rawFile and metaFile files with correct file types
  if (!req.files.rawFile || path.extname(req.files.rawFile.name) != '.zip') {
  	err.details = "Raw file is missing or selected file type is not supported!"
    return false;
  }
  if (!req.files.metaFile || path.extname(req.files.metaFile.name) != '.csv'  ) {
  	err.details = "Metadata file is missing or selected file type is not supported!"
    return false;
  }
  
  // TODO: All Other 'online' request-related verifications 

  return true;
}

////////////////////////for new submission/////////////////////////////////////

exports.verifyMetaFileHeaderFields = function (metaFileType,metaFileUrl,err) {
  err.details = "";
    
  // verify if each column is existing
  var metaFileHeaderFields = [];
  var fileContents = fs.readFileSync(metaFileUrl);
  var lines = fileContents.toString().split('\n');
  
  metaFileHeaderFields = lines[0].toString().split(',').map(element => {
    return element.toLowerCase().trim();
  });

  var reference_header_fields = getReferenceHeaderFields(metaFileType);

  missingColumn = [];
  
  for(var i =0;i<reference_header_fields.length;i++){
    // check = meta_file_obj_arr[i].replace(/\s/g, "");
    if(!metaFileHeaderFields.includes(reference_header_fields[i])){
      missingColumn.push(reference_header_fields[i]);
    }
  }
  
  if(missingColumn.length > 0){
    err.details = "Meta File Header is missing the following fields: " + missingColumn.join();
  return false;
  }
  
  return true;
}

//////////////////////// For Modification  ///////////////////////////// 

exports.modifyVerifyMetaFileHeaderFields = function (metaFileType,metaFileUrl,err) {
  err.details = "";
    
  // verify if each column is existing
  var metaFileHeaderFields = [];
  var fileContents = fs.readFileSync(metaFileUrl);
  var lines = fileContents.toString().split('\n');
  
  metaFileHeaderFields = lines[0].toString().split(',').map(element => {
    return element.toLowerCase().trim();
  });

  var reference_header_fields = modifyGetReferenceHeaderFields(metaFileType);

  missingColumn = [];
  
  for(var i =0;i<reference_header_fields.length;i++){
    // check = meta_file_obj_arr[i].replace(/\s/g, "");
    if(!metaFileHeaderFields.includes(reference_header_fields[i])){
      missingColumn.push(reference_header_fields[i]);
    }
  }
  if(missingColumn.length > 0){
      err.details = "Meta File Header is missing the following fields: " + missingColumn.join();
      return false;
  }
  return true;
}

  //////////////////////////////for new submission////////////////////////////////////////////////
exports.verifyAndGetMetaDataRows = function (metaFileUrl,metaFileType,err) {
  err.details = "";

  var fileContents = fs.readFileSync(metaFileUrl);
  var lines = fileContents.toString().split('\n').filter(x=>x!=null&&x!="");
  if(lines.length<1){
    err.details = "Meta File Error, file has no contents!";
    return false;
  }
  var headers = lines[0].toString().split(',');

  if(lines.length<2){
    err.details = "Meta File Error, file has no contents other than header!";
    return false;
  }
  
  var fileNameColIndex = getRawFileNameColumnIndex(lines[0]);
  var requiredFieldsIndices = getRequiredFieldsColumnsIndices(lines[0],metaFileType);
  
  metaDataRows = [];
  rawFileNames = [];
  missingValue = [];
  contentError = [];
  duplication = [];

  for(var i =1;i<lines.length;i++){
    var values = lines[i].toString().split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/g);
    //console.log(" value " + values);
    
    // make sure all required field are present
    for (const requiredFieldIndex of requiredFieldsIndices) {
      if( values[requiredFieldIndex] == undefined && values[requiredFieldIndex] == null){
        //err.details = "Meta File Error, newline '\n' found for row " +  values;
        //return false;
        var y = i+1;
        contentError.push(y + " ");
        break;
      }
      else
      {
        var requiredFieldValue = values[requiredFieldIndex].trim();
        //console.log(" value  " + requiredFieldIndex + "is " + requiredFieldValue);
        if( requiredFieldValue == null || requiredFieldValue == ""){
          var x= i + 1;
          //console.log("Meta File Error, Invalid value " + requiredFieldValue.toString() + " found for required field '" + headers[requiredFieldIndex] + "' in line : " + i);
          missingValue.push(headers[requiredFieldIndex] + " in line : " + x);
          //err.details = "Meta File Error, Invalid value " + requiredFieldValue.toString() + " found for required field '" + headers[requiredFieldIndex] + "' in line : " + i;
          //return false;
        }
      }
    }
    
    // extract values of this row into an object
    var metaDataRow = {};
    headers.forEach(function(element,index) {
      metaDataRow[element.toLowerCase().trim()]  = values[index];      
    });

    // add this row to list of rows 
    metaDataRows.push(metaDataRow);

    // add filename of this row into file names list  
    var fileName = values[fileNameColIndex].trim();
    rawFileNames.push(fileName);
  }
  var error = "";
  var error1= "";
  var error2= "";
  if(contentError.length > 0 || missingValue.length > 0 || arrayHasDuplication(rawFileNames, err) ){
    if(contentError.length > 0){
      error = 'Meta File Error, Please check these suggested rows in meta file. Some of these rows may contain invalid characters or line break. : ' + contentError.join(); 
      //return false;
    }
    if(missingValue.length > 0){
      error1 =  'Meta File Error, no value found for required field ' + missingValue.join();
    //return false;
    }
    if(arrayHasDuplication(rawFileNames, err)){
      error2 = ' Meta File Error, raw file name duplication: ' + err.details;
    }
    err.details = error +'\n\n'+ error1 +'\n\n'+ error2;
    console.log(err.details);
    return false;
  }
  return metaDataRows;
}


////////////////////for modification////////////
exports.modifyVerifyAndGetMetaDataRows = function (metaFileUrl,metaFileType,err) {
  err.details = "";

  var fileContents = fs.readFileSync(metaFileUrl);
  var lines = fileContents.toString().split('\n').filter(x=>x!=null&&x!="");
  if(lines.length<1){
    err.details = "Meta File Error, file has no contents!";
    return false;
  }
  var headers = lines[0].toString().split(',');

  if(lines.length<2){
    err.details = "Meta File Error, file has no contents other than header!";
    return false;
  }
  
  var fileNameColIndex = getRawFileNameColumnIndex(lines[0]);
  var requiredFieldsIndices = modifyGetRequiredFieldsColumnsIndices(lines[0],metaFileType);
  
  metaDataRows = [];
  rawFileNames = [];
  // missingValue = [];
  // contentError = [];
  duplication = [];

  for(var i =1;i<lines.length;i++){
    var values = lines[i].toString().split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/g);
    //console.log(" value " + values);
    
    // make sure all required field are present
    // for (const requiredFieldIndex of requiredFieldsIndices) {
    //   if( values[requiredFieldIndex] == undefined && values[requiredFieldIndex] == null){
    //     //err.details = "Meta File Error, newline '\n' found for row " +  values;
    //     //return false;
    //     var y = i+1;
    //     contentError.push(y + " ");
    //     break;
    //   }
    //   else
    //   {
    //     var requiredFieldValue = values[requiredFieldIndex].trim();
    //     //console.log(" value  " + requiredFieldIndex + "is " + requiredFieldValue);
    //     if( requiredFieldValue == null || requiredFieldValue == ""){
    //       var x= i + 1;
    //       //console.log("Meta File Error, Invalid value " + requiredFieldValue.toString() + " found for required field '" + headers[requiredFieldIndex] + "' in line : " + i);
    //       missingValue.push(headers[requiredFieldIndex] + " in line : " + x);
    //       //err.details = "Meta File Error, Invalid value " + requiredFieldValue.toString() + " found for required field '" + headers[requiredFieldIndex] + "' in line : " + i;
    //       //return false;
    //     }
    //   }
    // }
    
    // extract values of this row into an object
    var metaDataRow = {};
    headers.forEach(function(element,index) {
      metaDataRow[element.toLowerCase().trim()]  = values[index];      
    });

    // add this row to list of rows 
    metaDataRows.push(metaDataRow);

    // add filename of this row into file names list  
    var fileName = values[fileNameColIndex].trim();
    rawFileNames.push(fileName);
  }
  // var error = "";
  // var error1= "";
  // var error2= "";
  // if(contentError.length > 0 || missingValue.length > 0 || arrayHasDuplication(rawFileNames, err) ){
  //   if(contentError.length > 0){
  //     error = 'Meta File Error, Please check these suggested rows in meta file. Some of these rows may contain invalid characters or line break. : ' + contentError.join(); 
  //     //return false;
  //   }
  //   if(missingValue.length > 0){
  //     error1 =  'Meta File Error, no value found for required field ' + missingValue.join();
  //   //return false;
  //   }
    if(arrayHasDuplication(rawFileNames, err)){
      err = ' Meta File Error, raw file name duplication: ' + err.details;
      return false;
    }
  
 
  // }
  return metaDataRows;
}




// get metadata rows to match the file name with raw files
exports.getMetaDataRows = function (metaFileUrl,metaFileType,err) {

  var fileContentstest = fs.readFileSync(metaFileUrl);
  var lines = fileContentstest.toString().split('\n').filter(x=>x!=null&&x!="");
  var headers = lines[0].toString().split(',');
  metaDataRowstest = [];

  for(var i =1;i<lines.length;i++){
    var values = lines[i].toString().split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/g);
    //console.log(" value " + values);
    
    // extract values of this row into an object
    var metaDataRowtest = {};
    headers.forEach(function(element,index) {
      metaDataRowtest[element.toLowerCase().trim()]  = values[index];      
    });

    // add this row to list of rows 
    metaDataRowstest.push(metaDataRowtest);

  }

  return metaDataRowstest;
}
////new submission//////
getRequiredFieldsColumnsIndices = function (metaFileHeaderLine,metaFileType) {
  metaFileHeaderFields = metaFileHeaderLine.toString().split(',').map(element => {
    return element.toLowerCase().trim();
  });

  reference_header_fields = getReferenceHeaderFields(metaFileType);
  //console.log ("required ref header " + reference_header_fields);
  //console.log ("required meta header " + metaFileHeaderFields);
  requiredHeaderFieldIndices = [];
  for (const headerField of reference_header_fields) {
    //console.log ("required header " + headerField);
    requiredHeaderFieldIndices.push(metaFileHeaderFields.findIndex(x=>x==headerField));
  }

  
  //console.log ("required header indices " + requiredHeaderFieldIndices);
  return requiredHeaderFieldIndices;
}



///////for modification/////////////
modifyGetRequiredFieldsColumnsIndices = function (metaFileHeaderLine,metaFileType) {
  metaFileHeaderFields = metaFileHeaderLine.toString().split(',').map(element => {
    return element.toLowerCase().trim();
  });

  reference_header_fields = modifyGetReferenceHeaderFields(metaFileType);
  //console.log ("required ref header " + reference_header_fields);
  //console.log ("required meta header " + metaFileHeaderFields);
  requiredHeaderFieldIndices = [];
  for (const headerField of reference_header_fields) {
    //console.log ("required header " + headerField);
    requiredHeaderFieldIndices.push(metaFileHeaderFields.findIndex(x=>x==headerField));
  }

  
  //console.log ("required header indices " + requiredHeaderFieldIndices);
  return requiredHeaderFieldIndices;
}




getRawFileNameColumnIndex = function (metaFileHeaderLine) {
  
  metaFileHeaderFields = metaFileHeaderLine.toString().split(',').map(element => {
    return element.toLowerCase().trim();
  });
  
  return metaFileHeaderFields.findIndex(x=>x=="filename");
}

arrayHasDuplication = function(array,err) {
  var alreadySeen = [];

  for (const str of array){
    if (alreadySeen.indexOf(str)>-1){
      duplication.push(str);
    }
    alreadySeen.push(str);
  }
  if(duplication.length >0){
    let unique=[...new Set(duplication)];
    err.details = unique.join();
    return true;

  } else
      return false;
}



////////////  for normal submission  ////////////
getReferenceHeaderFields = function (metaFileType) {  
  var reference_header_fields = metaFileType.toLowerCase() == "field"? reflectance_field_header_fields : reflectance_museum_header_fields;
  return reference_header_fields;
}


/////////////  for data modification  //////////////
modifyGetReferenceHeaderFields = function (metaFileType) {  
  var modify_reference_header_fields = metaFileType.toLowerCase() == "field"? modify_reflectance_field_header_fields : modify_reflectance_museum_header_fields;
  return modify_reference_header_fields;
}

