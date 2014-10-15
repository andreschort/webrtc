$(document).on('ready', function () {
    'use strict';

    var chat = new Chat();

    chat.init();
});

function Chat() {
    'use strict';
    
    this.connections = {};
    $(window).unload(this.disconnect.bind(this));
}

Chat.prototype.init = function () {
    'use strict';

    this.peer = new Peer({
        host: 'localhost',
        port: 9000,
        path: 'myapp'
    });
    
    var self = this;
    
    this.peer.on('open', function (id) {
        $('#myId').val(id);
        
        var room = self.parseQueryString(window.location.search)['room'];
        $.post(window.location.origin + '/api/join', {name: room, id: id}, function (data) {
            self.room = data;
            $.each(data.peers, function (i, v) { self.connect(v); });
        });
    });

    this.peer.on('connection', this.handleConnection.bind(this));
    this.peer.on('call', this.handleCall.bind(this));    
    this.peer.on('error', this.log.bind(this));
    
    this.peer.on('disconnected', function () {
        self.log('peer: disconnected');
    });
    
    this.peer.on('close', function () {
        self.log('peer: closed');
    });

    // botones
    $('#connect').click(this.connect.bind(this));
    $('#disconnect').click(this.disconnect.bind(this)).hide();
    $('#send').click(this.send.bind(this)).attr('disabled', true);
    $('#call').click(this.call.bind(this));
    $('#hangup').click(this.hangup.bind(this)).hide();

    // manejar tecla enter en inputs
    $('#targetId').on('keyup', function (e) {
        var code = e.keyCode || e.which;
        if (code == 13) {
            self.connect();
        }
    });

    $('#input').on('keyup', function (e) {
        var code = e.keyCode || e.which;
        if (code == 13) {
            self.send();
        }
    }).attr('disabled', true);
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
    
    this.mediaConnection = mediaConn;
    
    var self = this;

    var constraints = {
        audio: true,
        video: $('#withVideo').prop('checked')
    };
    
    this.getUserMedia(constraints, function (stream) {
        self.localStream = stream;
        $('#myVideo').show().attr('src', URL.createObjectURL(stream));
        mediaConn.answer(stream);
        self.handleMediaConnection(mediaConn);
    }, function (err) { alert(err); });
};

Chat.prototype.handleMediaConnection = function (mediaConn) {
    this.mediaConnection = mediaConn;
    
    $('#call').hide();
    $('#withVideo').parent().hide();
    $('#hangup').show();
    
    mediaConn.on('stream', function (stream) {
        $('#remoteVideo').show().attr('src', URL.createObjectURL(stream));
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

    $('#targetIdLabel').text('Conectado con');
    $('#targetId').val(conn.peer).attr('disabled', true);
    $('#connect').hide();
    $('#disconnect').show();
    $('#input').attr('disabled', false).focus();
    $('#send').attr('disabled', false);

    var message = 'Conectado con ' + conn.peer;
    if ($('#chatLog').val().length > 0){
        message = '\n' + message;
    }

    $('#chatLog').append(message);
};

Chat.prototype.handleData = function (conn, data) {
    'use strict';

    $('#chatLog').append("\n" + conn.peer +  ": " + data);
};

Chat.prototype.handleClose = function (conn) {
    'use strict';

    $('#targetIdLabel').text('Id destino');
    $('#targetId').attr('disabled', false).focus();
    $('#connect').show();
    $('#disconnect').hide();
    $('#chatLog').append('\nDesconectado de ' + conn.peer);
    $('#input').attr('disabled', true);
    $('#send').attr('disabled', true);
};

// acciones

Chat.prototype.connect = function (id) {
    'use strict';

    var targetId = id || $('#targetId').val();

    var connection = this.peer.connect(targetId);
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

    $.each(this.connections, function (prop, val) {
        val.close();
    });
    
    $.post(window.location.origin + '/api/leave', {name: room, id: id});
};

Chat.prototype.log = function (err) {
    console.log(err);
    $('#chatLog').append('\n' + err);
};

Chat.prototype.call = function () {
    'use strict';
    
    var constraints = {
        audio: true,
        video: $('#withVideo').prop('checked')
    };

    var self = this;
    this.getUserMedia(constraints, function (stream) {
        self.localStream = stream;
        $('#myVideo').show().attr('src', URL.createObjectURL(stream));
        var mediaConn = self.peer.call($('#targetId').val(), stream);
        self.handleMediaConnection(mediaConn);
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