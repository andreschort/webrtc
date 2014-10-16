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
var morgan     = require('morgan');
var _          = require("underscore");

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080; 		// set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); 				// get an instance of the express Router

var rooms = {};

router.route('/join').post(function(req, res) {
    if (rooms[req.body.room] === undefined) {
        rooms[req.body.room] = [];
    }
    
    res.json({ room: req.body.room, peers: rooms[req.body.room] });
    
    if (req.body.id && req.body.id.length > 0 && rooms[req.body.room].indexOf(req.body.id) === -1) {
        rooms[req.body.room].push({ id: req.body.id, name: req.body.name });
    }
});

router.route('/name/:room?/:id?').get(function (req, res) {
    var room = rooms[req.params['room']];
        
    if (room === undefined) {
        room = [];
    }
    
    var result = _.find(room, function (peer) { return peer.id === req.params['id']; });
    res.json(result.name);
});

router.route('/leave').post(function(req, res) {
    var room = rooms[req.body.room];
    console.log(room);
    
    if (room) {
        room = _.reject(room, function (peer) { return peer.id === req.body.id });
        rooms[req.body.room] = room;
        console.log(rooms);
    }
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/', express.static('static'));
app.use(morgan('dev'));
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);