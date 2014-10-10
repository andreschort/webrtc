$(document).on('ready', function () { $('#disconnect').hide(); });

var peer = new Peer({host: 'localhost', port: 9000, path: 'myapp'});
var connection;

peer.on('open', function(id) {
    $('#myId').val(id);
});

peer.on('connection', function(conn) {
    connection = conn;
    
    conn.on('open', function () { connected(conn);});
    
    conn.on('data', function(data){
        var chatLog = $('#chatLog');
        chatLog.val(chatLog.val() + "\n Other: " + data);
    });
});

function connect() {
    var targetId = $('#targetId').val();
    connection = peer.connect(targetId);
    connection.on('open', function(){
        $('#targetIdLabel').text('Conectado con');
        $('#targetId').attr('disabled', true);
        $('#connect').hide();
        $('#disconnect').show();
    });
}

function send() {
    connection.send($('#input').val());
}

function disconnect() {
    connection.close();
}

function connected(conn) {
    
}