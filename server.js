
// set up ======================================================================
var express = require('express');
var engines = require('consolidate');
var app = express(); 						                    // create our app w/ express
var port = process.env.PORT || 3000; 				            // set the port
var database = require('./config/database'); 			        // load the database config
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var path = require('path');

app.engine('html',engines.nunjucks);
app.set('view engine','html');

app.set('views',path.join(__dirname,'public/views'));
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended': 'true'}));           // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({type: 'application/vnd.api+json'}));   // parse application/vnd.api+json as json
app.use(methodOverride('X-HTTP-Method-Override'));              // override with the X-HTTP-Method-Override header in the request
app.use(express.static(path.join(__dirname, './public')));		// set the static files location /public/img will be /img for users

// routes ======================================================================
require('./app/routes.js')(app);

app.listen(port);
console.log("App listening on port " + port);
