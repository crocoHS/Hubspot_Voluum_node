var Todo = require('./models/todo');
var database = require('../config/database');            // load the database config
var Hubspot = require('hubspot');
var axios = require('axios');
var _ = require('lodash');

var accessToken;
var campaigns;

module.exports = function (app) {

  app.get('/api/voluum', function (req, res) {

    if(req.query.code){
      var code = req.query.code;

      var hubspot = new Hubspot({
        clientId: '85b7d6e9-823c-42bd-93b6-60e5014df31f',
        clientSecret: 'ec2f8e97-03a2-450b-8a82-3b850f8c087d',
        redirectUri: 'http://localhost:3000/api/voluum',
        grant_type: "authorization_code"
      })

      hubspot.oauth.getAccessToken({
        code: code
      }).then(result => {
        accessToken = result.access_token;
      });
    }

    var accToken = '';
    this.res = res;
    var data = JSON.stringify({
      email: 'jon@secretshopping.co',
      password: '$Il4naio1!'
    });

    axios.post(`https://api.voluum.com/auth/session`, data, {
      headers: {
          'Content-Type': 'application/json',
      }
    })
    .then(function (response) {
      var day = new Date();
      var month = day.getMonth() + 1;
      month = (month < 10 ? '0' : '') + month;
      var date = day.getDate()+1;
      date = (date < 10 ? '0' : '') + date;
      var tomorrow = day.getFullYear() + "-" + month + "-" + date + "T00:00:00Z";

      var accToken = response.data.token;

      axios.get(`https://api.voluum.com/report?include=ACTIVE&columns=campaignName&columns=offerName&columns=custom-variable-1&groupBy=offer&groupBy=campaign&groupBy=customVariable1&limit=500&from=2018-06-27T00:00:00Z&to=2018-06-30T00:00:00`, {
        'headers' : {
          'Content-Type': 'application/json',
          'cwauth-token' : accToken
        }
      })
      .then(function (response) {
        campaigns = response.data.rows;

        axios.get(`https://api.voluum.com/report?include=ACTIVE&columns=custom-variable-1&columns=custom-variable-3&groupBy=customVariable3&groupBy=customVariable1&limit=500&from=2018-06-27T00:00:00Z&to=2018-06-30T00:00:00`, {
          'headers' : {
            'Content-Type': 'application/json',
            'cwauth-token' : accToken
          }
        })
        .then(function (response) {
          var customInfo = response.data.rows;

          var campaignList = _.filter(campaigns, function(campaign) {
            if (campaign.conversions != 0 && campaign.customVariable1 != '') {

              customList = _.find(customInfo, function(custom) {
                if (custom.customVariable1 == campaign.customVariable1) {
                  return custom;
                }
              });

              campaign['customVariable3'] = customList.customVariable3;

              return campaign;
            }
          });
          res.render('voluum', {'campaigns': campaignList});
        })
        .catch(function (error) {
          console.log(error);
        });

      })
      .catch(function (error) {
        console.log(error);
      });

    })
    .catch(function (error) {
      console.log("Failed@@@@");
    });
  });

  app.post('/hubspot/form/submit', function(req, res) {

    var data = req.body.data;

    console.log(data);

    axios.post(`https://api.hsforms.com/submissions/v3/integration/submit/4645451/6fd0db6c-b4ae-4e16-924b-920a166298e3`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
    })
    .then(function(response) {
      console.log('ok');
      console.log(response.data);

      res.send('ok');
    })
    .catch(function(error) {
      console.log(error);
    });
  });

  app.get('/hubspot/getbyId', function(req, res) {

    axios.get(`https://api.hubapi.com/contacts/v1/contact/vid/101/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization' : 'Bearer '+ accessToken
        }
    })
    .then(function(response) {
      console.log(response.data);

      res.send('ok');
    })
    .catch(function(error) {
      console.log(error);
    });
  });

  app.post('/hubspot/form/create', function(req, res) {
    var data = req.body.data;

    axios.post(`https://api.hubapi.com/forms/v2/forms?hapikey=93766d43-0bf4-4aae-9116-8161ef16b227`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(function(response) {

      res.send('ok');
    })
    .catch(function(error) {
      console.log(error);
    });
  });

  app.post('/hubspot/contact/update', function (req, res) {

    var perData = req.body.data[0].personData;
    var offerData = req.body.data[0].offerData;
    var formData = req.body.data[0].formData;
    var submitData = req.body.data[0].submitData;
    console.log(submitData);

    axios.post(`https://api.hubapi.com/contacts/v1/contact/email/croconero@gmail.com/profile`, perData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization' : 'Bearer '+ accessToken
      }
    })
    .then(function (response) {

      axios.get(`https://api.hubapi.com/contacts/v1/contact/email/croconero@gmail.com/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization' : 'Bearer '+ accessToken
        }
      })
      .then(function (response) {

        var resData = response.data;

        var hubspotOwner = {"value": resData.properties.hubspot_owner_id['value'], "name": "hubspot_owner_id"};

        offerData.properties.push(hubspotOwner);

        axios.post(`https://api.hubapi.com/deals/v1/deal`, offerData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization' : 'Bearer '+ accessToken
          }
        })
        .then(function (response) {

          var formName = _.filter(offerData.properties, {'name': 'dealname'});

          var formData = {
            "name": formName[0]['value'],
            "action": "",
            "method": "",
            "cssClass": "",
            "redirect": "",
            "submitText": "Submit",
            "followUpId": "",
            "notifyRecipients": "",
            "leadNurturingCampaignId": "",
            "formFieldGroups": [
              {
                "fields": [
                  {
                    "name": "firstname",
                    "label": "First Name",
                    "type": "string",
                    "fieldType": "text",
                    "description": "",
                    "groupName": "",
                    "displayOrder": 0,
                    "required": false,
                    "selectedOptions": [],
                    "options": [],
                    "validation": {
                      "name": "",
                      "message": "",
                      "data": "",
                      "useDefaultBlockList": false
                    },
                    "enabled": true,
                    "hidden": false,
                    "defaultValue": "",
                    "isSmartField": false,
                    "unselectedLabel": "",
                    "placeholder": ""
                  }
                ],
                "default": true,
                "isSmartGroup": false
              },
              {
                "fields": [
                  {
                    "name": "lastname",
                    "label": "Last Name",
                    "type": "string",
                    "fieldType": "text",
                    "description": "",
                    "groupName": "",
                    "displayOrder": 1,
                    "required": false,
                    "selectedOptions": [],
                    "options": [],
                    "validation": {
                      "name": "",
                      "message": "",
                      "data": "",
                      "useDefaultBlockList": false
                    },
                    "enabled": true,
                    "hidden": false,
                    "defaultValue": "",
                    "isSmartField": false,
                    "unselectedLabel": "",
                    "placeholder": ""
                  }
                ],
                "default": true,
                "isSmartGroup": false
              },
              {
                "fields": [
                  {
                    "name": "email",
                    "label": "Email",
                    "type": "string",
                    "fieldType": "text",
                    "description": "",
                    "groupName": "",
                    "displayOrder": 2,
                    "required": false,
                    "selectedOptions": [],
                    "options": [],
                    "validation": {
                      "name": "",
                      "message": "",
                      "data": "",
                      "useDefaultBlockList": false
                    },
                    "enabled": true,
                    "hidden": false,
                    "defaultValue": "",
                    "isSmartField": false,
                    "unselectedLabel": "",
                    "placeholder": ""
                  }
                ],
                "default": true,
                "isSmartGroup": false
              }
            ],
            "createdAt": 1318534279910,
            "updatedAt": 1413919291011,
            "performableHtml": "",
            "migratedFrom": "ld",
            "ignoreCurrentValues": false,
            "metaData": [],
            "deletable": true
          };

          axios.post(`https://api.hubapi.com/forms/v2/forms?hapikey=93766d43-0bf4-4aae-9116-8161ef16b227`, formData, {
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(function(response) {

            var portalID = response.data.portalId;
            var guid = response.data.guid;
            console.log(response.data);

            var firstName = _.filter(perData.properties, {'property': 'firstname'});
            var lastName = _.filter(perData.properties, {'property': 'lastname'});

            console.log(firstName, lastName);
            var subData = {
              fields: [
                {
                  name: "email",
                  value: "croconero@gmail.com"
                },
                {
                  name: "firstname",
                  value: firstName[0]['value']
                },
                {
                  name: "lastname",
                  value: lastName[0]['value']
                }
              ]
            }

            axios.post(`https://api.hsforms.com/submissions/v3/integration/submit/${portalID}/${guid}`, subData, {
              headers: {
                'Content-Type': 'application/json'
              }
            })
            .then(function(response) {

              res.send('ok');
            })
            .catch(function(error) {
              console.log(error);
            });
          })
          .catch(function(error) {
            console.log(error);
          });
        })
        .catch(function (error) {
          console.log(error);
        });
      })
      .catch(function (error) {
        console.log(error);
      });

    })
    .catch(function (error) {
      console.log(error);
    });
  });

  // application -------------------------------------------------------------
  app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
  });
};
