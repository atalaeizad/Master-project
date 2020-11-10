var express = require('express');
const path = require('path');

const fs = require('fs');
const app = express();

exports.uploadFileToServer = function(file,callBackFun) {
  let uploadPath = path.dirname(__dirname) + '/uploads/' + file.name;

  file.mv(uploadPath, callBackFun);

  return path.resolve(path.normalize(uploadPath));
}