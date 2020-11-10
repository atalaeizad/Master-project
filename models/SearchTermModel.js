// File: ./models/somemodel.js

//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var SearchTermSchema = new Schema({
  Name: String,
  Placeholder: String,
  Enabled: Boolean,
  creationTime: { type: Date, default: Date.now() }
  },
  { strict: false }
);

//Export function to create "SomeModel" model class
module.exports = mongoose.model('SearchTerm', SearchTermSchema );