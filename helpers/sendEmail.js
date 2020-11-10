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



exports.generateUploadReport= function (name, result, uploadSet) {

    let body = `Dear ${name},\n\n`;
        body += "Your Submission Identification Number is :" + uploadSet.submissionInfo._id+ "\n\n";
  
      if (result.warnings.length > 0 ||
          result.errors.length > 0 ||
          result.corrupt.length > 0)
      {
          body +="We found some issues in your uploaded files.\n\n";
              if (result.corrupt.length > 0) {
                body += 'Following files have been removed for your submission. \n Corrupt files:\n' + result.corrupt.map(f => f + '\n') + '\n';
               
              }
        
              if (result.warnings.length > 0) {
                  body += `Warning:\n In raw files, ${
                      result.warnings.length
                  } reflective values in range [-2, 0]:\n${
                      makeErrorTable(result.warnings)
                  }`;
              }
          
              if (result.errors.length > 0) {
        
                  body += ` Errors:\n In raw files, ${
                      result.errors.length
                  } reflective value less than -2:\n${
                      makeErrorTable(result.errors)
                  }\n`;
              }
      } else {
          body += "<h3>Congratulations, your data submission is Successful.</h3><br>";
      }
  
  
  
      // body += "<p>The following files passed our verification tests and will be released: </p>";
      // for (var i = rawFilesList.length - 1; i >= 0; i--) {
      //   body += "<p>" + path.basename(rawFilesList[i]) + "</p>";
      // }
      body += "<p>Please find the attached file contains calculated metrics result.</p><br>";
      body += "<p>Thank you for using Nature's Palette System.</p><br>";
      body += '\nSincerely,\nNature\'s Palette';
      body = body.replace(/\n/g, '<br>');
      return body;
  }

makeErrorTable = function (rows) {
    return makeHtmlTable([
        'File', 'Wave Length', 'Value'
    ], rows.map(row => {
        return [row.file, row.wavelen, row.value];
    }));
}

makeHtmlTable = function (cols, rows) {
    return `<table><thead><tr>${cols.map(col => `<th>${escapeHtml(col)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(val => `<td>${escapeHtml(val.toString())}</td>`).join('')}</tr>`).join('')}</tbody></table>`
}


exports.sendSuccessEmail = function (emailAddress,emailBody,rawFolderPath){
    "use strict";
    const nodemailer = require("nodemailer");
  
    // async..await is not allowed in global scope, must use a wrapper
    async function main() {
      // Generate test SMTP service account from ethereal.email
      // Only needed if you don't have a real mail account for testing
      // let testAccount = await nodemailer.createTestAccount();
  
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // use TLS
        auth: {
          user: "naturepalette.org@gmail.com",
          pass: "edyxnetbeskcasjt"
        },
        tls: {
          // do not fail on invalid certs
          rejectUnauthorized: false
        }
      });
  
      // verify connection configuration
      transporter.verify(function(error, success) {
        if (error) {
          console.log(error);
        } else {
          console.log("Server is ready to take our messages");
        }
      });
  
      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"Natures Palette" <naturepallete@gmail.com>', // sender address
        to: emailAddress, // list of receivers
        subject: "Nature's Palette Upload Report", // Subject line
        text: "Nature's Palette Upload Report", // plain text body
        html: emailBody, // html body
        attachments: [
          {
            path: `${rawFolderPath}Temporary_Metrics_file.csv`
          }
        ]
      });
  
      // emails sent
      console.log("Message sent: %s", info.messageId);
  
      // Preview only available when sending through an Ethereal account
      //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    }
  
    main().catch(console.error);
    
}

//generate error report body 
  
exports.generateErrorReport =  function (name, report) {
    let body = `Dear ${name},\n\n`;
  
  
      body +="We found some problem with your files. The submission did not pass our verification tests.\n\n";
      //body += 'Following issues have been found in your submission: \n\n' + report.map(f => f + '\n\n') + '\n';
    
      // body += "<p>The following files passed our verification tests and will be released: </p>";
      // for (var i = rawFilesList.length - 1; i >= 0; i--) {
      //   body += "<p>" + path.basename(rawFilesList[i]) + "</p>";
      // }
      body += "<p>Please follow the submission instructions and submit your files again.</p><br>";
      body += "<p>Thank you for using Nature's Palette System.</p><br>";
      body += '\nSincerely,\nNature\'s Palette';
      body = body.replace(/\n/g, '<br>');
      return body;
  }


//send error report to the uploader
exports.sendErrorEmail =  function (emailAddress,emailBody,errorReportPath){
    "use strict";
    const nodemailer = require("nodemailer");
  
    // async..await is not allowed in global scope, must use a wrapper
    async function main() {
      // Generate test SMTP service account from ethereal.email
      // Only needed if you don't have a real mail account for testing
      // let testAccount = await nodemailer.createTestAccount();
  
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // use TLS
        auth: {
          user: "naturepalette.org@gmail.com",
          pass: "edyxnetbeskcasjt"
        },
        tls: {
          // do not fail on invalid certs
          rejectUnauthorized: false
        }
      });
  
      // verify connection configuration
      transporter.verify(function(error, success) {
        if (error) {
          console.log(error);
        } else {
          console.log("Server is ready to take our messages");
        }
      });
  
      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"Natures Palette" <naturepallete@gmail.com>', // sender address
        to: emailAddress, // list of receivers
        subject: "Nature's Palette Error Report", // Subject line
        text: "Nature's Palette Error Report", // plain text body
        html: emailBody, // html body
        attachments: [
            {
              path: errorReportPath
            }
          ]
  
      });
  
      // emails sent
      console.log("Message sent: %s", info.messageId);
  
      // Preview only available when sending through an Ethereal account
      //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    }
  
    main().catch(console.error);
}
  
  