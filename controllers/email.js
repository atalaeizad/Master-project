
var express = require('express');
const app = express();



var userEmail = "";
//var emailBody = "";
var fullName = "";



exports.postEmail = function(req, res) {

    "use strict";
    const nodemailer = require("nodemailer");


    async function main() {

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
        var textBody = `FROM: ${req.body.name} EMAIL: ${req.body.email} MESSAGE: ${req.body.message}`;
        var htmlBody = `<h2>Mail From Contact Form</h2><p>From: ${req.body.name}</p><br><p> <a href="mailto:${req.body.email}">${req.body.email}</a></p><p>${req.body.message}</p>`;
    
      //console.log(userInfo);
      // send mail with defined transport object
      let info =await transporter.sendMail({
        from: '"Natures Palette" <naturepalette.org@gmail.com>', // sender address
        to:  ' <naturepalette.org@gmail.com>', // list of receivers
        subject: "Nature's Palette User Feedback form : "+ req.body.name, // Subject line
        text: textBody,
		    html: htmlBody
      });


      // emails sent
      console.log("Message sent: %s", info.messageId);
  
      // Preview only available when sending through an Ethereal account
      //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      let response = "Email Has been sent to the Nature's Palette";    
    }

    main().catch(console.error);
    //res.status(201).send({message : 'Email Has been sent'})
    //res.send("Email Has been sent to the Nature's Palette");
    let response = "Email Has been sent to the Nature's Palette";
    res.render('contact', {error: null, user: req.user , message: response});
  };