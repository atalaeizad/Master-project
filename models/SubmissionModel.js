// File: ./models/somemodel.js

//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var SubmissionSchema = new Schema({
  submissionInfoId: String,
  rawFileId: String,
  metaDataFileId: String,
  recordId: String,
  creationTime: { type: Date, default: Date.now() }
  },
  { strict: false }
);

//Export function to create "SomeModel" model class
module.exports = mongoose.model('Submission', SubmissionSchema );
