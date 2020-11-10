
var mongoose = require('mongoose');
var passport = require('passport');
//var LocalStrategy = require('passport-local').Strategy;
var OrcidStrategy = require('passport-orcid').Strategy;
var Account = require('../models/Account');

passport.serializeUser(function (user, done) {
    done(null, user)
  })
  
  passport.deserializeUser(function (user, done) {
    done(null, user)
  })


//passport.use(new LocalStrategy(Account.authenticate()));
passport.use(new OrcidStrategy({
    //sandbox: process.env.NODE_ENV !== 'production', // use the sandbox for non-production environments
    
    //clientID: "APP-JQLAP8QRWU6H04U3", // sandbox
    //clientSecret: "952e2107-50d0-4b71-8c95-e5747bdeaac4", /sandbox

    clientID: "APP-WIZVS87GHA1JZVXH", //original
    clientSecret: "71bd35ca-17f9-4593-9764-6bedf4337930", //original
    //callbackURL: 'http://localhost:3000/auth/orcid/callback'
    callbackURL: 'http://34.123.96.63/auth/orcid/callback'
}, function (accessToken, refreshToken, params, profile, done) {
    //const { userorcid, fullname, token } = profile._json;
    //profile = { orcid: params.orcid, name: params.name , token: accessToken}
    //new Account(profile).save();
    //return done(null, profile)
    Account.findOne({ orcid: params.orcid }, function(err, account) {
        if(err) {
          console.log(err);  // handle errors!
        }
        if (!err && account !== null) {
          done(null, account);
        } else {
         
          account = new Account({
            orcid: params.orcid,
            name: params.name,
            token: accessToken
          });
          console.log(account);
          account.save(function(err) {
            if(err) {
              console.log(err);  // handle errors!
            } else {
              console.log("saving user ...");
              
              done(null, account);
            }
          });
        }
      });
    }
  
));