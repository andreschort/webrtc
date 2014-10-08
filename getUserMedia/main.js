navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;

var constraints = {video: true};

var success = function (stream) {
    var video = document.getElementById('video');
    video.src = URL.createObjectURL(stream);
};

var error = function(err) {
    console.log(err);
};

navigator.getUserMedia(constraints, success, error);