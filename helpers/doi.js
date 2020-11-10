
const request = require('request');

exports.addDoi= function(subInfo, callback) {
    //var obj = { data: {type: "dois", attributes: {prefix : "10.80611"}} };
    var ob1 = {data:{attributes:{contributors:[{nameType:"string",name:subInfo.name}],prefix:"10.80611",publisher:"Nature's Palette"},type:"doi"}};

    //var subInfo = {data:{attributes:{contributors:[{nameType:"string",name: SubInfo.name}],prefix:"10.80611",publisher:"Nature's Palette"},type:"doi"}};
    var data =JSON.stringify(ob1);

    const options = {
        method: 'POST',
        url: 'https://api.test.datacite.org/dois',
        headers: {
          'content-type': 'application/vnd.api+json',
          authorization: 'Basic TVVOLk5BVFVSRTpJY2ViZXJnMQ=='
        },
        //body: '{"data":{"attributes":{"prefix":"10.80611","publisher":"rabeya"},"type":"doi"}}'
        body: data
      }; 


    var res = '';
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 201) {
            res = body;
        }
        else {
            res = 'Not Found';
        }
        callback(res);
    });
}
// jsonObject = JSON.stringify({
//     "message" : "The web of things is approaching, let do some tests to be ready!",
//     "name" : "Test message posted with node.js",
//     "caption" : "Some tests with node.js",
//     "link" : "http://www.youscada.com",
//     "description" : "this is a description",
//     "picture" : "http://youscada.com/wp-content/uploads/2012/05/logo2.png",
//     "actions" : [ {
//         "name" : "youSCADA",
//         "link" : "http://www.youscada.com"
//     } ]
// });

//   // TODO: Extract All parameters 
//   submissionInfo.name = requestBody.fname + " " + requestBody.lname;
//   submissionInfo.email = requestBody.email;
//   submissionInfo.institute = requestBody.institute;

//   submissionInfo.typeOfData = requestBody.dataType;
//   submissionInfo.dataFrom = requestBody.dataFrom;
//   submissionInfo.published = requestBody.dataPublished;
//   submissionInfo.reference = requestBody.reference;
//   submissionInfo.doi = requestBody.doi;
//   submissionInfo.embargo = requestBody.dataEmbargo;
//   submissionInfo.releaseDate = requestBody.embargoDate;