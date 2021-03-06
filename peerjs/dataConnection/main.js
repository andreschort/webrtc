$(document).on('ready', function () {
    'use strict';

    var chat = new Chat();

    chat.init();
});

function Chat() {
    'use strict';
}

Chat.prototype.init = function () {
    'use strict';

    this.peer = new Peer({
        host: '10.60.1.5',
        port: 9000,
        path: 'myapp'
    });
    
    var self = this;
    
    this.peer.on('open', function (id) {
        $('#myId').val(id);
    });

    this.peer.on('connection', this.handleConnection.bind(this));
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

    this.connection = conn;

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
};

// eventos de una conexion

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

    $('#chatLog').append("\nEl: " + data);
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

Chat.prototype.connect = function () {
    'use strict';

    var targetId = $('#targetId').val();

    var connection = this.peer.connect(targetId);
    this.handleConnection(connection);
};

Chat.prototype.send = function () {
    'use strict';

    var data = $('#input').val();
    $('#chatLog').append('\nYo: ' + data);

    this.connection.send(data);
    $('#input').val('').focus();
};

Chat.prototype.disconnect = function () {
    'use strict';

    this.connection.close();
};

Chat.prototype.log = function (err) {
    console.log(err);
    $('#chatLog').append('\n' + err);
};