/*
  Begin Global Variables
*/
  // Time that current segment started
  var lastTime = -1;
  // Length of current segment
  var segmentLength = 0;
/*
  End Global Variables
*/

$(document).ready(function () {
  setVideoFromUrl();
  begin();
});

/*
  Started once the DOM finishes loading
*/
function begin() {
  var videoIndex = parseInt($(".video-selector").val(), 10);

  loadVideo(videoIndex);
  loadStartTime();
  loadCaptions(videoIndex);
  loadAnnotations();
  loadSuggestedChanges();
  loadComments();
  bindEventListeners();
  changePlaybackSpeed();
}

/*
  Sets the correct video from url parameters
*/
function setVideoFromUrl() {
  var videoIndex = getParameterByName("videoIndex");
  if (videoIndex) {
    $(".video-selector option").eq(videoIndex).attr('selected', true);
  }
}

/*
  Gets a URL parameter by name
*/
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

/*
  Load video start time from url parameters
*/
function loadStartTime() {
  var startTime = getParameterByName("startTime");
  var video = $(".main-video").get(0);
  video.addEventListener("loadedmetadata", function () {
    video.currentTime = startTime;
    var windowLocation = window.location.toString();
    var base_url = windowLocation.substring(0, windowLocation.indexOf("?"));
    window.history.replaceState({}, document.title, base_url);
    //easy hack to prevent autoplay on the annotations page
    if(windowLocation.includes('viewer')) {
      video.play();
    }
  });
}

/*
  Binds event listeners on input elements
*/
function bindEventListeners() {
  $(".video-selector").off().change(begin);
  $(".playback-selector").off().change(changePlaybackSpeed);
  $(".caption").click(editCaption);
}

/*
  Changes the playback speed
*/
function changePlaybackSpeed() {
  var playbackRate = parseFloat($(".playback-selector").val());
  $(".main-video").get(0).playbackRate = playbackRate;
}

/*
  Load the captions for video at index i
*/
function loadCaptions(i) {
  $(".transcription-viewer-container").empty();
  var captions = videoCaptions[i];
  captions.forEach(function (caption) {
    var captionTime = (caption.width / 64).toFixed(2);
    var template = '<div class="caption" data-time="' + captionTime + '">' + caption.text.toLowerCase() + '</div>'
    $(".transcription-viewer-container").append(template);
  });
  updateHighlightedCaption(0);
}

/*
 Retrieves all annotations for the given video and binds them to the timeupdate event
*/
function loadAnnotations() {
  var videoName = $(".video-selector option:selected").text();
  $.get("/api/loadAnnotations", { video: videoName }, function(annotations) {
    $(".main-video").on("timeupdate", bindAnnotations(annotations));
  });
}

/*
 Iterates through the annotations and displays them at the appropriate time.
*/
function bindAnnotations(annotations) {
  var wrapper = function() {
    for (var index = 0; index < annotations.length; index++) {
      if (this.currentTime > annotations[index].time) {
        if($(".annotation#" + annotations[index].id).length === 0) { //only want to display annotation if isn't already on page
          $(".annotations-container").append('<div class="annotation" id="' + annotations[index].id + '">' +
          annotations[index].content + '</div>');
        }
      }
    }
  };
  return wrapper;
}

function loadSuggestedChanges() {
  React.render(
      React.createElement(SuggestionsBox, {url: "/api/getSuggestedChanges"}),
      $(".suggestions-container")[0]
  )
}

function editCaption() {
  var videoName = $(".video-selector option:selected").text();
  var time = this.dataset.time;
  var caption = { video: videoName, time: time, content: this.textContent };
  React.render(
      React.createElement(CaptionEditBox, {data: caption}),
      $('.caption-edit-container')[0]
  );
}

function loadComments() {
  React.render(
      React.createElement(CommentBox, {url: "/api/getComments"}),
      $(".comments-container")[0]
  )
}

var CaptionEditBox = React.createClass({displayName: "CaptionEditBox",
  getInitialState: function() {
    return {value: this.props.data.content};
  },
  handleChange: function(event) {
    this.setState({value: event.target.value});
  },
  handleSubmit: function(event) {
    var video = $(".main-video").get(0);
    $.ajax({
      method: "PUT",
      url: "/api/suggestTranscriptChange",
      data: { suggestion: $('.captionEditBox > textarea').val(), time: video.currentTime, video: this.props.data.video }
    }).done(function(data) {

    });
  },
  render: function() {
    var value = this.state.value;
    return (
        React.createElement("div", {time: this.props.data.time, className: "captionEditBox"}, 
          React.createElement("textarea", {value: value, onChange: this.handleChange}), 
          React.createElement("button", {onClick: this.handleSubmit}, "Suggest improvement")
        )
    )
  }
});

var SuggestionsBox = React.createClass({displayName: "SuggestionsBox",
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    var self = this;
    var videoName = $(".video-selector option:selected").text();
    $.get(self.props.url, {video: videoName}, function(suggestionsData) {
      self.setState({data: JSON.parse(suggestionsData)});
    })
  },
  render: function() {
    return (
      React.createElement("div", {className: "suggestionBox"}, 
        React.createElement("h3", null, "Suggested Transcription Changes"), 
        React.createElement(SuggestionList, {data: this.state.data})
      )
    );
  }
});

var Suggestion = React.createClass({displayName: "Suggestion",
  handleVote: function(event) {
    if($(event.target).hasClass('voteUp')) {
      var vote = true;
      $(event.target).removeClass('icon-action-grey600 icon-action-grey600-ic_thumb_up_grey600_24dp').addClass('icon-action-black icon-action-black-ic_thumb_up_black_24dp');
    } else {
      var vote = false;
      $(event.target).removeClass('icon-action-grey600 icon-action-grey600-ic_thumb_down_grey600_24dp').addClass('icon-action-black icon-action-black-ic_thumb_down_black_24dp');
    }
    $.ajax({
      method: "PUT",
      url: "/api/submitSuggestionVote",
      data: { suggestionID: this.props.suggestionID, vote: vote }
    }).done(function(data) {

    })
  },
  render: function() {
    return (
        React.createElement("div", null, 
          React.createElement("p", null, this.props.children), 
          React.createElement("div", {onClick: this.handleVote, className: "voteUp icon-action-grey600 icon-action-grey600-ic_thumb_up_grey600_24dp"}), 
          React.createElement("div", {onClick: this.handleVote, className: "voteDown icon-action-grey600 icon-action-grey600-ic_thumb_down_grey600_24dp"})
        )
    );
  }
});

var SuggestionList = React.createClass({displayName: "SuggestionList",
  render: function() {
    var suggestionNodes = this.props.data.map(function (suggestion) {
      return (
          React.createElement(Suggestion, {key: suggestion.suggestionID, suggestionID: suggestion.suggestionID, creator: suggestion.userID}, 
            suggestion.suggestion
          )
      );
    });
    return (
        React.createElement("div", {className: "suggestionList"}, 
          suggestionNodes
        )
    );
  }
});

var Comment = React.createClass({displayName: "Comment",
  handleVote: function(event) {
    if($(event.target).hasClass('voteUp')) {
      var vote = true;
      $(event.target).removeClass('icon-action-grey600 icon-action-grey600-ic_thumb_up_grey600_24dp').addClass('icon-action-black icon-action-black-ic_thumb_up_black_24dp');
    } else {
      var vote = false;
      $(event.target).removeClass('icon-action-grey600 icon-action-grey600-ic_thumb_down_grey600_24dp').addClass('icon-action-black icon-action-black-ic_thumb_down_black_24dp');
    }
    $.ajax({
      method: "PUT",
      url: "/api/",
      data: { suggestionID: null, vote: vote }
    }).done(function(data) {

    })
  },
  render: function() {
    return (
        React.createElement("div", {className: "comment"}, 
          React.createElement("p", null, this.props.children), 
          React.createElement("div", {onClick: this.handleVote, className: "voteUp icon-action-grey600 icon-action-grey600-ic_thumb_up_grey600_24dp"}), 
          React.createElement("div", {onClick: this.handleVote, className: "voteDown icon-action-grey600 icon-action-grey600-ic_thumb_down_grey600_24dp"})
        )
    );
  }
});

var CommentList = React.createClass({displayName: "CommentList",
  render: function() {
    var commentNodes = this.props.data.map(function (comment) {
      comment.style = {
        margin: '0 0 0 ' + comment.depth + 'px'
      };
      return (
          React.createElement(Comment, {key: comment.commentID, commentID: comment.commentID, author: comment.userID, style: comment.style}, 
            comment.commentText
          )
      )
    });
    return (
        React.createElement("div", {className: "commentList"}, 
          commentNodes
        )
    );
  }
});

var CommentForm = React.createClass({displayName: "CommentForm",
  getInitialState: function() {
    return {value: ''};
  },
  handleChange: function(event) {
    this.setState({value: event.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var text = React.findDOMNode(this.refs.text).value.trim();
    var videoName = $(".video-selector option:selected").text();
    var parentID = 0; //TODO: change to grab real parentID
    if (!text) {
      return;
    }
    this.props.onCommentSubmit({parentID: parentID, commentText: text, video: videoName});
    React.findDOMNode(this.refs.text).value = '';
    return;
  },
  render: function() {
    var value = this.state.value;
    return (
        React.createElement("form", {className: "commentForm", onSubmit: this.handleSubmit}, 
          React.createElement("textarea", {value: value, ref: "text", onChange: this.handleChange}), 
          React.createElement("input", {type: "submit", value: "Post"})
        )
    );
  }
});

var CommentBox = React.createClass({displayName: "CommentBox",
  handleCommentSubmit: function(comment) {
    $.ajax({
      url: '/api/submitComment',
      dataType: 'json',
      type: 'PUT',
      data: comment,
      success: function(data) {
        //this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error('submitComment', status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    var self = this;
    var videoName = $(".video-selector option:selected").text();
    $.get(self.props.url, {video: videoName}, function(data) {
      self.setState({data: data});
    })
  },
  render: function() {
    return (
        React.createElement("div", {className: "commentBox"}, 
          React.createElement("h3", null, "Comments"), 
          React.createElement(CommentList, {data: this.state.data}), 
          React.createElement(CommentForm, {onCommentSubmit: this.handleCommentSubmit})
        )
    );
  }
});

/*
  Update the highlighted caption given the current time
*/
function updateHighlightedCaption(currentTime) {
  var currentSegment = findCurrentSegment(currentTime);
  scrollToSegment(currentSegment);
  $(".selected-caption").removeClass("selected-caption");
  currentSegment.addClass("selected-caption");
  lastTime = parseFloat(currentSegment.data("startingTime"));
  segmentLength = parseFloat(currentSegment.data("time"));
}

/*
  Interval to refresh highlighted caption
*/
setInterval(function () {
  var currentTime = $(".main-video").get(0).currentTime;

  if (currentTime > (lastTime + segmentLength) || currentTime < lastTime) {
    updateHighlightedCaption(currentTime);
  }
}, 50);

/*
  Find the current segment given a video time
*/
function findCurrentSegment(time) {
  var numCaptions = $(".caption").length;
  var timeAccumulator = 0;

  var currentSegment = $(".caption").first();
  for (var i = 0; i < numCaptions; i++) {
    if (timeAccumulator > time) {
      break;
    }

    currentSegment = $(".caption").eq(i);
    currentSegment.data("startingTime", timeAccumulator);
    timeAccumulator += parseFloat(currentSegment.data("time")) + (2/64); // 2/64 accounts for border...
  }
  return currentSegment;
}

/*
  Scrolls to a specific segment given the segment object
*/
function scrollToSegment(segment) {
  var viewerContainer = $('.transcription-viewer-container');
  viewerContainer.animate({
      scrollTop: viewerContainer.scrollTop() - viewerContainer.offset().top + segment.offset().top - 100
  }, 500);
}