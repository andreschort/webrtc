// server.js
var PeerServer = require('peer').PeerServer;
var server = new PeerServer({port: 9000, path: '/myapp'});

server.on('connection', function(id) { 
    console.log('connected: ' + id);
});

server.on('disconnect', function(id) { 
    console.log('disconnected: ' + id);
})


// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express'); 		// call express
var app        = express(); 				// define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080; 		// set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); 				// get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
	// do logging
	console.log('Something is happening.');
	next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	res.json({ message: 'hooray! welcome to our api!' });
});

var rooms = {};

router.route('/join')

	// create a bear (accessed at POST http://localhost:8080/api/bears)
	.post(function(req, res) {
		if (rooms[req.body.name] === undefined) {
            rooms[req.body.name] = [];
        }
    
        res.json({ nombre: req.body.name, peers: rooms[req.body.name] });
    
        if (req.body.id && req.body.id.length > 0 && rooms[req.body.name].indexOf(req.body.id) === -1) {
            rooms[req.body.name].push(req.body.id);
        }
	});

router.route('/leave')

	// create a bear (accessed at POST http://localhost:8080/api/bears)
	.post(function(req, res) {
		if (rooms[req.body.name]) {
            var indexOf = rooms[req.body.name].indexOf(req.body.id);
            if (indexOf > -1) {
                rooms[req.body.name].splice(indexOf, 1);
            }
        }
	});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/', express.static('static'));
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);