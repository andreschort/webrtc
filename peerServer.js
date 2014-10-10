var PeerServer = require('peer').PeerServer;
var server = new PeerServer({port: 9000, path: '/myapp'});

server.on('connection', function(id) { 
    console.log('connected: ' + id);
});

server.on('disconnect', function(id) { 
    console.log('disconnected: ' + id);
})