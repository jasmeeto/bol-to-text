$( document ).ready(function() {
  var errorCallback = function(e) {
  	console.log('Rejected!', e);
  };

  var recognizer = new Module.Recognizer();
  
  navigator.getUserMedia  = navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia ||
                            navigator.msGetUserMedia;
  window.AudioContext = window.AudioContext ||
                        window.webkitAudioContext;

  var context = new AudioContext();

  if (navigator.getUserMedia){
  	console.log('here');
    var audio = $('#mic')[0];
  	navigator.getUserMedia({audio: true}, function(stream) {
      audio.src = window.URL.createObjectURL(stream);
      audio.on('play', function() {
        // todo
      });
    }, errorCallback);

  } else {
  	alert('getUserMedia() is not supported in your browser');
  	audio.src = 'someaudio.wav';
  }

  recognizer.delete();
}); // document ready