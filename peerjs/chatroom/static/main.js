$(document).on('ready', function () {
    'use strict';

    var chat = new Chat();

    chat.init();
});

function Chat() {
    'use strict';
    
    this.connections = {};
    this.mediaConnections = {};
    $(window).unload(this.disconnect.bind(this));
}

Chat.prototype.init = function () {
    'use strict';

    var self = this;

    // botones
    $('#connect').click(this.connectPeer.bind(this));
    $('#disconnect').click(this.disconnect.bind(this)).hide();
    $('#send').click(this.send.bind(this)).attr('disabled', true);
    $('#call').click(this.call.bind(this)).hide();
    $('#hangup').click(this.hangup.bind(this)).hide();

    // manejar tecla enter en inputs
    $('#input').on('keyup', function (e) {
        var code = e.keyCode || e.which;
        if (code == 13) {
            self.send();
        }
    }).attr('disabled', true);
    
    $('#myName').on('keyup', function (e) {
        var code = e.keyCode || e.which;
        if (code == 13) {
            self.connectPeer();
        }
    });
};

Chat.prototype.connectPeer = function () {
    'use strict';
    
    this.myName = $('#myName').attr({readonly: true, disabled: true}).val();
    
    this.peer = new Peer({
        host: 'localhost',
        port: 9000,
        path: 'myapp'
    });
    
    this.peer.on('open', this.handlePeerOpen.bind(this));
    this.peer.on('connection', this.handleConnection.bind(this));
    this.peer.on('call', this.handleCall.bind(this));    
    this.peer.on('error', this.log.bind(this));
    
    var self = this;
    this.peer.on('disconnected', function () {
        self.log('peer: disconnected');
    });
    
    this.peer.on('close', function () {
        self.log('peer: closed');
    });
};

Chat.prototype.handlePeerOpen = function (id) {
    'use strict';
    
    $('#myId').val(id);
    $('#connect').hide();
    $('#disconnect').show();
    $('#call').show();
    
    var room = this.parseQueryString(window.location.search)['room'] || '';
    var path = window.location.origin + '/api/join';
    var parameters = {
        room: room,
        id: id,
        name: this.myName
    };
    
    $.post(path, parameters, this.loadRoom.bind(this));
};

Chat.prototype.loadRoom = function (data) {
    'use strict';
    
    this.room = data.room;
    this.names = {};
    var self = this;
    var party = $('#party');
    $.each(data.peers, function (i, v) {
        self.names[v.id] = v.name;
        self.connect(v.id);
        $('<li/>').text(v.name).appendTo(party);
    });
    
    $('<li/>').text(this.myName).appendTo(party);
};

Chat.prototype.handleConnection = function (conn) {
    'use strict';

    this.connections[conn.peer] = conn;

    var self = this;
    conn.on('data', function (data) {
        self.handleData(conn, data);
    });

    conn.on('open', function () {
        self.handleOpen(conn);
    });

    conn.on('close', function () {
        self.handleClose(conn);
    });
    
    conn.on('error', function (err) { alert(err); });
};

Chat.prototype.handleCall = function (mediaConn) {
    'use strict';
    
    var constraints = {
        audio: true,
        video: true
    };
        
    if (this.localStream) {
        mediaConn.answer(this.localStream);
        this.handleMediaConnection(mediaConn);
    }
    else {
        var self = this;
        this.getUserMedia(constraints, function (stream) {
            self.localStream = stream;
            $('#myVideo').attr('src', URL.createObjectURL(stream));
            mediaConn.answer(stream);
            self.handleMediaConnection(mediaConn);
        }, function (err) { alert(err); });
    }
};

Chat.prototype.handleMediaConnection = function (mediaConn) {
    this.mediaConnections[mediaConn.peer] = mediaConn;
    
    $('#call').hide();
    $('#withVideo').parent().hide();
    $('#hangup').show();
    
    mediaConn.on('stream', function (stream) {
        $('<video/>').attr({id: mediaConn.peer, autoplay: true, src: URL.createObjectURL(stream)}).appendTo($('#remotes'));
        $('<br/>').appendTo($('#remotes'));
    });
    
    var self = this;
    mediaConn.on('close', function () {
        self.localStream.stop();
        
        $('#call').show();
        $('#withVideo').parent().show();
        $('#hangup').hide();
        $('#remoteVideo').hide();
        $('#myVideo').hide();
    });
};

// eventos de un DataConnection

Chat.prototype.handleOpen = function (conn) {
    'use strict';

    $('#connect').hide();
    $('#disconnect').show();
    $('#input').attr('disabled', false).focus();
    $('#send').attr('disabled', false);

    var name = this.names[conn.peer];
    
    if (name === undefined) {
        var self = this;
        var parameters = { room: this.room, id: conn.peer };
        $.get(window.location.origin + '/api/name/' + this.room + '/' + conn.peer, {}, function (data) {
            self.names[conn.peer] = name = data;
            
            var message = 'Conectado con ' + name;
    if ($('#chatLog').val().length > 0){
        message = '\n' + message;
    }

    $('#chatLog').append(message);
        });
    }else {
        var message = 'Conectado con ' + name;
    if ($('#chatLog').val().length > 0){
        message = '\n' + message;
    }

    $('#chatLog').append(message);
    }
    
    
};

Chat.prototype.handleData = function (conn, data) {
    'use strict';

    $('#chatLog').append("\n" + this.names[conn.peer] +  ": " + data);
};

Chat.prototype.handleClose = function (conn) {
    'use strict';

    $('#connect').show();
    $('#disconnect').hide();
    $('#chatLog').append('\nDesconectado de ' + this.names[conn.peer]);
    $('#input').attr('disabled', true);
    $('#send').attr('disabled', true);
    
    this.connections = _.reject(this.connections, function (x) { return x.peer === conn.peer; });
    delete this.names[conn.peer];
};

// acciones

Chat.prototype.connect = function (id) {
    'use strict';

    var connection = this.peer.connect(id);
    this.handleConnection(connection);
};

Chat.prototype.send = function () {
    'use strict';

    var data = $('#input').val();
    $('#chatLog').append('\nYo: ' + data);

    $.each(this.connections, function (prop, val) {
        val.send(data);
    });
    
    $('#input').val('').focus();
};

Chat.prototype.disconnect = function () {
    'use strict';
    
    $('#connect').show();
    $('#disconnect').hide();
    $('#myName').attr({disabled: false, readonly: false}).focus();
    $('#input').attr('disabled', true);
    $('#send').attr('disabled', true);

    $.each(this.connections, function (prop, val) {
        val.close();
    });
    
    $.post(window.location.origin + '/api/leave', {name: this.room, id: this.peer.id});
};

Chat.prototype.log = function (err) {
    console.log(err);
    $('#chatLog').append('\n' + err);
};

Chat.prototype.call = function () {
    'use strict';
    
    var constraints = {
        audio: true,
        video: true
    };

    var self = this;
    this.getUserMedia(constraints, function (stream) {
        self.localStream = stream;
        $('#myVideo').attr('src', URL.createObjectURL(stream));
        
        _.each(self.connections, function (conn) {
            var mediaConn = self.peer.call(conn.peer, stream);
            self.handleMediaConnection(mediaConn);
        });
    }, function (err) { alert(err); });
};

Chat.prototype.getUserMedia = function (constraints, success, failure) {
    'use strict';
    
    var getMedia =  navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
    getMedia = getMedia.bind(navigator);
    
    getMedia(constraints, success, failure);
};

Chat.prototype.hangup = function () {
    'use strict';
    
    this.mediaConnection.close();
};

Chat.prototype.parseQueryString = function (queryString) {
    'use strict';
    
    var params = {}, queries, temp, i, l;
 
    // Split into key/value pairs
    queries = queryString.substring(1).split("&");
 
    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        params[temp[0]] = temp[1];
    }
 
    return params;
};