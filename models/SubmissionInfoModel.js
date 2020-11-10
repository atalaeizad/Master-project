// File: ./models/somemodel.js

//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var SubmissionInfoSchema = new Schema({
  submissionId: String,
  userId: String,
  recordId: Number,
  researchId: Number,
  metaDataCollectionId: Number,
  
  typeOfData: String,
  dataFrom: String,
  published: Boolean,
  reference: String,
  doi:String,
  embargo: Boolean,
  releaseDate: { type: Date, default: Date.now() },
  
  institute: String,
  name: String, 
  email: String,
  },
  { strict: false }
);

//Export function to create "SomeModel" model class
module.exports = mongoose.model('SubmissionInfo', SubmissionInfoSchema );
