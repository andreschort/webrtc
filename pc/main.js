navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;

var constraints = {video: true};

var success = function (stream) {
    var video = document.getElementById('localVideo');
    video.src = URL.createObjectURL(stream);
    window.pc.addStream(stream);
};

var error = function(err) {
    console.log(err);
};

navigator.getUserMedia(constraints, success, error);

var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.pc = new PeerConnection(null);
window.pc.onaddstream = gotRemoteStream;
window.pc.createOffer(function (desc) {
    var localDesc = document.getElementById('localDesc');
    localDesc.value = desc.sdp;
    window.pc.setLocalDescription(desc);
});

function call() {
    var remoteSdp = new RTCSessionDescription();
    
    remoteSdp.sdp = document.getElementById("remoteDesc")
    window.pc.setRemoteDescription(remoteSdp);
}

function gotRemoteStream(e) {
    var video = document.getElementById('remoteVideo');
    video.src = URL.createObjectURL(e.stream);
}