// File: ./models/somemodel.js

//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;


var MetaDataInformationSchema = new Schema({
  metadatacollectionid: Number,
  recordid: String,
  rawFileId: String,
  metaDataFileId: String,
  submissionId: String,

  // reflectance field and museum template required fields
  filename: String,
  genus: String,
  specificepithet: String,
  patch: String,
  lightangle1: String,
  lightangle2: String,
  probeangle1: String,
  probeangle2: String,
  replicate: String,

  // reflectance field template required fields
  uniqueid: String,

  // reflectance museum template required fields
  // TODO: Confirm with client string or number
  institutioncode: String,
  // TODO: Confirm with client string or number
  cataloguenumber: String,

  // other fields
  collectioncode: String,
  field: Number,
  class: String,
  order: String,
  family: String,
  infraSpecificepithet: String,
  sex: String,
  lifestage: String,
  country: String,

  timestamp: { type: Date, default: Date.now() }
  },
  { strict: false }
);

//Export function to create "SomeModel" model class
module.exports = mongoose.model('MetaDataInfo', MetaDataInformationSchema );
