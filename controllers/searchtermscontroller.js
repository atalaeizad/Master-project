var express = require('express');
const app = express();

const fs = require('fs');
const path = require('path');
const moment = require('moment');
var mongoose = require('mongoose');

var SearchTermModel = require('../models/SearchTermModel');

async function getEnabledSearchTerms() {
  let terms = await SearchTermModel.find({Enabled: true});
  return terms;
}

async function getSearchTerms() {
  let terms = await SearchTermModel.find();
  return terms;
}

async function getSearchTerm(id) {
  let term = await SearchTermModel.findOne({_id: id});
  return term;
}

async function getSearchTermByName(name) {
  let term = await SearchTermModel.findOne({Name: name});
  return term;
}

// get search terms
exports.getSearchTerms = function(req, res) {
  getSearchTerms().then( function (searchTermList) {
    res.render('searchTerms', {searchTerms: searchTermList, error: null, user: req.user});    
  })
};

// edit search term
exports.editSearchTerm = function(req, res) {
  getSearchTerm(req.body.Id).then( function (searchTerm) {
    
    if(typeof searchTerm != undefined && searchTerm != null){
      searchTerm.Placeholder = req.body.Placeholder;  
      
      if(typeof req.body.isEnabled != undefined && req.body.isEnabled != null && req.body.isEnabled == "on"){
        searchTerm.Enabled = true;  
      }else{
        searchTerm.Enabled = false
      }

      searchTerm.save().then(function () {
        getSearchTerms().then( function (searchTermList) {
          res.render('searchTerms', {searchTerms: searchTermList, error: null, user: req.user});    
        }) 
      });
    }

  })
};
// Delete search term
exports.deleteSearchTerm = function(req, res) {
  getSearchTerm(req.body.Id).then( function (searchTerm) {
    
    //if(typeof searchTerm != undefined && searchTerm != null){
    //searchTerm.Placeholder = req.body.Placeholder;  
      
    //  if(typeof req.body.isEnabled != undefined && req.body.isEnabled != null && req.body.isEnabled == "on"){
      //  searchTerm.Enabled = true;  
      //}else{
        //searchTerm.Enabled = false
      //}

      searchTerm.remove().then(function () {
        getSearchTerms().then( function (searchTermList) {
          res.render('searchTerms', {searchTerms: searchTermList, error: null, user: req.user});    
        }) 
      });
  })
};

// add search term
exports.addSearchTerm = function(req, res) {
  
  getSearchTermByName(req.body.Name).then(function (searchTerm) {
    if(searchTerm!=null){
      getSearchTerms().then( function (searchTermList) {
        res.render('searchTerms', {searchTerms: searchTermList, error: "Search Term Already Exists!", user: req.user});    
      }) ;
      return;
    }

    var newTerm = {};
    newTerm.Name = req.body.Name;
    newTerm.Placeholder = req.body.Placeholder;
    
    if(typeof req.body.isEnabled != undefined && req.body.isEnabled != null && req.body.isEnabled == "on"){
      newTerm.Enabled = true;  
    }else{
      newTerm.Enabled = false
    }
    
    SearchTermModel.create(newTerm, function (err, term_instance) {
      if (err){
        console.log("search term save ERROR! " + err);
        return false;
      }
  
      getSearchTerms().then( function (searchTermList) {
        res.render('searchTerms', {searchTerms: searchTermList, error: null, user: req.user});    
      }) ;
    });    
  })
};
