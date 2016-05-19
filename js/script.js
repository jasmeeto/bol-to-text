$( document ).ready(function() {

  var recognizer, recorder, callbackManager, audio_context;
  var isRecorderReady = isRecognizerReady = false;

  function postRecognizerJob(message, callback) {
    var msg = message || {};
    if(callbackManager) msg.callbackId = callbackManager.add(callback);
    if (recognizer) recognizer.postMessage(msg);
  };

  function spawnWorker(workerurl, onReady) {
      recognizer = new Worker(workerurl);
      recognizer.onmessage = function(event) {
        onReady(recognizer);
      };
      recognizer.postMessage('');
  };

  function updateHyp(hyp) {
    document.getElementById('text').innerHTML = hyp;
    console.log(hyp);
  };

  function updateUI() {
    if (isRecorderReady && isRecognizerReady) startBtn.disabled = stopBtn.disabled = false;
  };

  function updateStatus(newStatus) {
    //document.getElementById('current-status').innerHTML += "<br/>" + newStatus;
    console.log(newStatus);
  };

  function displayRecording(display) {
    if (display) document.getElementById('recording-indicator').innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
    else document.getElementById('recording-indicator').innerHTML = "";
  };

  function startUserMedia(stream) {
    var input = audio_context.createMediaStreamSource(stream);
    window.firefox_audio_hack = input;
    var audioRecorderConfig = {errorCallback: function(x) {updateStatus("Error from recorder: " + x);}};
    recorder = new AudioRecorder(input, audioRecorderConfig);
    // If a recognizer is ready, we pass it to the recorder
    if (recognizer) recorder.consumers = [recognizer];
    isRecorderReady = true;
    updateUI();
    updateStatus("Audio recorder ready");
  };

  var startRecording = function() {
  //var id = document.getElementById('grammars').value;
  console.log("starting");
  var id = 'Digits';
  if (recorder && recorder.start(id)) displayRecording(true);
  else console.log("wtf");
  };

  var stopRecording = function() {
    recorder && recorder.stop();
    displayRecording(false);
  };

  var recognizerReady = function() {
       //updateGrammars();
       isRecognizerReady = true;
       updateUI();
       updateStatus("Recognizer ready");
  };

  var updateGrammars = function() {
    var selectTag = document.getElementById('grammars');
    for (var i = 0 ; i < grammarIds.length ; i++) {
        var newElt = document.createElement('option');
        newElt.value=grammarIds[i].id;
        newElt.innerHTML = grammarIds[i].title;
        selectTag.appendChild(newElt);
    }                          
  };


  var feedGrammar = function(g, index, id) {
    if (id && (grammarIds.length > 0)) grammarIds[0].id = id.id;
    if (index < g.length) {
      grammarIds.unshift({title: g[index].title})
postRecognizerJob({command: 'addGrammar', data: g[index].g},
                         function(id) {feedGrammar(grammars, index + 1, {id:id});});
    } else {
      recognizerReady();
    }
  };

  var feedWords = function(words) {
       postRecognizerJob({command: 'addWords', data: words},
                    function() {feedGrammar(grammars, 0);});
  };

  var initRecognizer = function() {
      postRecognizerJob({command: 'initialize'},
                        function() {
                                    if (recorder) recorder.consumers = [recognizer];
                                    feedWords(wordList);});
  };

  window.onload = function() {
    if (window.location.protocol != "https:")
      window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
    updateStatus("Initializing Web Audio and speech recognizer, waiting for approval to access your microphone");
    callbackManager = new CallbackManager();
    spawnWorker("js/pocketsphinx/recognizer.js", function(worker) {
        worker.onmessage = function(e) {
            if (e.data.hasOwnProperty('id')) {
              var clb = callbackManager.get(e.data['id']);
              var data = {};
              if( e.data.hasOwnProperty('data')) data = e.data.data;
              if(clb) clb(data);
            }
            if (e.data.hasOwnProperty('hyp')) {
              var newHyp = e.data.hyp;
              if (e.data.hasOwnProperty('final') &&  e.data.final)
              newHyp = "Final: " + newHyp;
              updateHyp(newHyp);
            }
            if (e.data.hasOwnProperty('status') && (e.data.status == "error")) {
              updateStatus("Error in " + e.data.command + " with code " + e.data.code);
            }
        };
        initRecognizer();
    });
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      window.URL = window.URL || window.webkitURL;
      audio_context = new AudioContext();
    } catch (e) {
      updateStatus("Error initializing Web Audio browser");
    }
    if (navigator.getUserMedia) navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
                                    updateStatus("No live audio input in this browser");
                                });
    else updateStatus("No web audio support in this browser");

  var startBtn = document.getElementById('startBtn');
  var stopBtn = document.getElementById('stopBtn');
  startBtn.disabled = true;
  stopBtn.disabled = true;
  startBtn.onclick = startRecording;
  stopBtn.onclick = stopRecording;
  };

   // This is the list of words that need to be added to the recognizer
   // This follows the CMU dictionary format
  var wordList = [["ONE", "W AH N"], ["TWO", "T UW"], ["THREE", "TH R IY"], ["FOUR", "F AO R"], ["FIVE", "F AY V"], ["SIX", "S IH K S"], ["SEVEN", "S EH V AH N"], ["EIGHT", "EY T"], ["NINE", "N AY N"], ["ZERO", "Z IH R OW"], ["NEW-YORK", "N UW Y AO R K"], ["NEW-YORK-CITY", "N UW Y AO R K S IH T IY"], ["PARIS", "P AE R IH S"] , ["PARIS(2)", "P EH R IH S"], ["SHANGHAI", "SH AE NG HH AY"], ["SAN-FRANCISCO", "S AE N F R AE N S IH S K OW"], ["LONDON", "L AH N D AH N"], ["BERLIN", "B ER L IH N"], ["SUCKS", "S AH K S"], ["ROCKS", "R AA K S"], ["IS", "IH Z"], ["NOT", "N AA T"], ["GOOD", "G IH D"], ["GOOD(2)", "G UH D"], ["GREAT", "G R EY T"], ["WINDOWS", "W IH N D OW Z"], ["LINUX", "L IH N AH K S"], ["UNIX", "Y UW N IH K S"], ["MAC", "M AE K"], ["AND", "AE N D"], ["AND(2)", "AH N D"], ["O", "OW"], ["S", "EH S"], ["X", "EH K S"]];
  // This grammar recognizes digits
  var grammarDigits = {numStates: 1, start: 0, end: 0, transitions: [{from: 0, to: 0, word: "ONE"},{from: 0, to: 0, word: "TWO"},{from: 0, to: 0, word: "THREE"},{from: 0, to: 0, word: "FOUR"},{from: 0, to: 0, word: "FIVE"},{from: 0, to: 0, word: "SIX"},{from: 0, to: 0, word: "SEVEN"},{from: 0, to: 0, word: "EIGHT"},{from: 0, to: 0, word: "NINE"},{from: 0, to: 0, word: "ZERO"}]};
  // This grammar recognizes a few cities names
  var grammarCities = {numStates: 1, start: 0, end: 0, transitions: [{from: 0, to: 0, word: "NEW-YORK"}, {from: 0, to: 0, word: "NEW-YORK-CITY"}, {from: 0, to: 0, word: "PARIS"}, {from: 0, to: 0, word: "SHANGHAI"}, {from: 0, to: 0, word: "SAN-FRANCISCO"}, {from: 0, to: 0, word: "LONDON"}, {from: 0, to: 0, word: "BERLIN"}]};
  // This is to play with beloved or belated OSes
  var grammarOses = {numStates: 7, start: 0, end: 6, transitions: [{from: 0, to: 1, word: "WINDOWS"}, {from: 0, to: 1, word: "LINUX"}, {from: 0, to: 1, word: "UNIX"}, {from: 1, to: 2, word: "IS"}, {from: 2, to: 2, word: "NOT"}, {from: 2, to: 6, word: "GOOD"}, {from: 2, to: 6, word: "GREAT"}, {from: 1, to: 6, word: "ROCKS"}, {from: 1, to: 6, word: "SUCKS"}, {from: 0, to: 4, word: "MAC"}, {from: 4, to: 5, word: "O"}, {from: 5, to: 3, word: "S"}, {from: 3, to: 1, word: "X"}, {from: 6, to: 0, word: "AND"}]};
  var grammars = [{title: "OSes", g: grammarOses}, {title: "Digits", g: grammarDigits}, {title: "Cities", g: grammarCities}];
  var grammarIds = [];
}); // document ready