$(document).on('ready', function () {
    $('#disconnect').hide();
});

var peer = new Peer({host: 'localhost', port: 9000, path: 'myapp'});
var connection;

peer.on('open', function(id) {
    $('#myId').val(id);
});

peer.on('connection', function(conn) {
    connection = conn;
    
    conn.on('open', function () { connected(conn);});
    
    conn.on('data', function(data){
        $('#chatLog').append("\nEl: " + data);
    });

    conn.on('close', function() { disconnected(); });
});

function connect() {
    var targetId = $('#targetId').val();
    connection = peer.connect(targetId);
    connection.on('open', function(){ connected(connection); });
    connection.on('close', function() { disconnected();});
    connection.on('data', function(data) {
        $('#chatLog').append("\nEl: " + data);
    });
}

function send() {
    var data = $('#input').val();
    $('#chatLog').append('\nYo: ' + data);
    connection.send(data);
    $('#input').val('').focus();
}

function disconnect() {
    connection.close();
    disconnected();
}

function disconnected() {
    $('#targetIdLabel').text('Id destino');
    $('#targetId').attr('disabled', false);
    $('#connect').show();
    $('#disconnect').hide();
    $('#chatLog').append('Desconectado de ' + conn.peer);
}

function connected(conn) {
    $('#targetIdLabel').text('Conectado con');
    $('#targetId').val(conn.peer).attr('disabled', true);
    $('#connect').hide();
    $('#disconnect').show();
    $('#chatLog').append('\nConectado con ' + conn.peer);
}
