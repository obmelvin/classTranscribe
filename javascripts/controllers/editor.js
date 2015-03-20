// Global reference to the wavesurfer
var globalSurfer;

// Metrics object
var metrics = {};

// Start time global reference
var startTime;

$(document).ready(function () {
  begin();
  initializeMetricsBaseInformation();
});

/*
  Gets basic metrics information
*/
function initializeMetricsBaseInformation() {
  metrics["name"] = window.prompt("What's your netID");
}

/*
  Started once the DOM finishes loading
*/
function begin() {
  var videoIndex = parseInt($(".video-selector").val(), 10);

  initializeUI();
  loadVideo(videoIndex);
  loadCaptions(videoIndex);
  bindEventListeners();
  bindVideoEvents();
  changePlaybackSpeed();
}

/*
  Initialize the UI to default states
*/
function initializeUI() {
  $(".waveform-loading").removeClass("hidden");
  $(".transcription-input").focus();
}

/*
  Binds event listeners on input elements
*/
function bindEventListeners() {
  $(".video-selector").off().change(begin);
  $(".playback-selector").off().change(changePlaybackSpeed);
  $(window).off().keypress(function (e) {
    if (e.which === 126) {
      e.preventDefault();
      incrementMetricCount("toggleVideo");
      toggleVideo();
    } else if (e.which === 96) {
      e.preventDefault();
      incrementMetricCount("rewindTwoSeconds");
      rewindTwoSeconds();
    }
  })
}

/*
  Binds event listeners on the video
*/
function bindVideoEvents() {
  var video = $(".main-video").get(0);

  var lastUpdate = 0;
  video.ontimeupdate = function () {
    globalSurfer.skip(video.currentTime - globalSurfer.getCurrentTime());
  };

  video.onended = function(e) {
    calculateTotalTime();
  };

  video.addEventListener("loadedmetadata", function () {
    loadWaveform(function () {
      video.onplay = function () {
        globalSurfer.play();
      }
      video.onpause = function () {
        globalSurfer.pause();
      }
    });
  });
}

/*
  Rewind the video 5 seconds
*/
function rewindTwoSeconds() {
  var video = $(".main-video").get(0);
  video.currentTime = video.currentTime - 2;
}

/*
  Changes the playback speed
*/
function changePlaybackSpeed() {
  var playbackRate = parseFloat($(".playback-selector").val());
  $(".main-video").get(0).playbackRate = playbackRate;
  loadWaveform($.noop);
}

/*
  Changes the video play/pause
*/
function toggleVideo() {
  var video = $(".main-video").get(0);
  if (video.paused == false) {
    video.pause();
  } else {
    video.play();
  }
}

/*
  Load the captions for a certain video
*/
function loadCaptions(videoIndex) {
  var captions = videoCaptions[videoIndex];

  $(".caption-track-final-caption").remove();
  captions.forEach(function (caption) {
    var template = '<div class="caption-track-final-caption" draggable="true" contentEditable="true" style="width:' + caption.width + 'px"></div>';
    $(".final-caption-track").append(template);
    $(".caption-track-final-caption").last().text(caption.text).resizable({
        handles: 'e'
    });
  });

  $(".caption-track-final-caption").dblclick(function () {
    var offsetLeft = $(this).offset().left - $(this).parent().offset().left + $(this).parent().scrollLeft();
    var barOffsetLeft = (globalSurfer.getCurrentTime() / globalSurfer.getDuration()) * $(".waveform-outer").width()
    $(this).width(Math.abs(barOffsetLeft - offsetLeft));
    incrementMetricCount("editSegmentLengthDoubleClick", barOffsetLeft - offsetLeft);
  });

  $(".caption-track-final-caption").click(function () {
    incrementMetricCount("editSegmentText");
  });

  var video = $(".main-video").get(0);
  $(".caption-track-final-caption").on("resize", function () {
    var offsetLeft = $(this).offset().left + $(this).width() - $(this).parent().offset().left + $(this).parent().scrollLeft();
    $(".final-caption-black-bar").css('left', offsetLeft + "px");

    video.currentTime = ((offsetLeft + 1) / $(".waveform-outer").width()) * globalSurfer.getDuration();
  });

  var startWidth;
  $(".caption-track-final-caption").on("resizestart, mousedown", function () {
    startWidth = $(this).width();
    $(".final-caption-black-bar").show();
  });

  $(".caption-track-final-caption").on("resizestop, mouseup", function () {
    $(".final-caption-black-bar").hide();
    var endWidth = $(this).width() - startWidth;
    incrementMetricCount("editSegmentLengthDrag", endWidth);
  })

  $(".final-caption-track, .waveform-container").off().scroll(function() {
    $(".final-caption-track").scrollLeft($(this).scrollLeft());
    $(".waveform-container").scrollLeft($(this).scrollLeft());
    updateTimeLine($(this).scrollLeft());
  });
}

/*
  Converts a time integer to a time string
*/
function timeNumToString(timeNum) {
  var timeNumInMinutes = Math.floor(timeNum / 60);
  var timeNumInSeconds = Math.floor(timeNum % 60);

  if (timeNumInSeconds < 10) {
    return timeNumInMinutes + ":0" + timeNumInSeconds;
  }
  return timeNumInMinutes + ":" + timeNumInSeconds;
}

/*
  Update the timeline
*/
var currentStartTime = 0;
function updateTimeLine(scroll) {
  if (currentStartTime + 64 > 64 * scroll || currentStartTime - 64 < 64 * scroll) {
    currentStartTime = 64 * scroll;
    $(".timestamp").each(function (i) {
      var time = timeNumToString(Math.round(scroll / 64) + i);
      $(this).text(time);
    });
  }
}

/*
  Load the waveform for a certain video
*/
function loadWaveform(cb) {
  var videoIndex = parseInt($(".video-selector").val(), 10);
  var wavesurfer = Object.create(WaveSurfer);
  var videoSrc = VIDEOS[videoIndex][1];
  var video = $(".main-video").get(0);

  $("#waveform").empty();

  var captionTrackWidth = (video.duration * 64) + ($(".caption-track-final-caption").length * (2/64));
  $(".waveform-outer").css("width", captionTrackWidth + "px");

  var options = {
    container     : document.querySelector('#waveform'),
    waveColor     : '#5195CE',
    progressColor : '#005DB3',
    loaderColor   : '#005DB3',
    cursorColor   : 'silver',
    pixelRatio    : 1,
    minPxPerSec   : 5,
    height        : 100,
    audioRate     : parseFloat($(".playback-selector").val()),
    normalize     : true,
  };
  wavesurfer.init(options);
  wavesurfer.setVolume(0);
  wavesurfer.load(videoSrc);

  wavesurfer.on('ready', function () {
    wavesurfer.skip(video.currentTime)
    var scrollLeft = video.currentTime * 64 - 200;
    $(".final-caption-track, .waveform-container").animate({scrollLeft: scrollLeft}, 500);
    $(".waveform-loading").addClass("hidden");
  });

  var previousTime = 0;
  wavesurfer.on('seek', function () {
    var wavesurferTime = wavesurfer.getCurrentTime();
    if (Math.abs(previousTime - wavesurferTime) > 0.2) {
      incrementMetricCount("videoSeek", {time: wavesurferTime - previousTime});
      video.currentTime = wavesurferTime;
      $(".transcription-input").focus();
    }
    previousTime = wavesurferTime;
  })

  globalSurfer = wavesurfer;
  cb();
}

/*
  Returns the total width of the transcription
*/
function totalTranscriptionWidth() {
  var totalWidth = 0;
  $(".caption-track-final-caption").each(function(i) {
    totalWidth += parseInt($(this).width(), 10) + (2/64);
  });
  return totalWidth;
}


/*
  Converts a time string to a time integer
*/
function incrementMetricCount(name, data) {
  if (!startTime) {
    startTime = new Date();
  }

  metrics[name] = (metrics[name] || {})
  metrics[name].count = (metrics[name].count || 0) + 1;
  if (data) {
    metrics[name].data = (metrics[name].data || []).concat(data);
  }
}

/*
  Calculate total trancsription time
*/
function calculateTotalTime() {
  if (!metrics["totalTime"]) {
    metrics["totalTime"] = (new Date()).getTime() - startTime.getTime();
  }
}

/*
  Save the transcriptions
*/
function save() {
  var finalCaptions = [];
  $(".caption-track-final-caption").each(function (i, el) {
    finalCaptions.push({
      text: $(el).text(),
      width: $(el).width()
    })
  })
  console.log(JSON.stringify(finalCaptions));
}


/*
  Save the metrics
*/
function stats() {
  var videoIndex = parseInt($(".video-selector").val(), 10);
  metrics["video"] = VIDEOS[videoIndex][0];
  calculateTotalTime();
  console.log(JSON.stringify(metrics));
}

/*
  Interval to update the red bar
*/
var lastTime = -1;
setInterval(function () {
  var currentTime = $(".main-video").get(0).currentTime;

  if (currentTime != lastTime) {
    $(".final-caption-red-bar").css('left', currentTime * 64 + "px");
    lastTime = currentTime;
  }
}, 100);