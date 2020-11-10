// File: ./models/somemodel.js

//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var RawFileSchema = new Schema({
  submissionId: String,
  name: String,
  type: String,
  path: String,
  uploadDate: { type: Date, default: Date.now() },
  creationTime: { type: Date, default: Date.now() }
  },
  { strict: false }
);

//Export function to create "SomeModel" model class
module.exports = mongoose.model('RawFile', RawFileSchema );
