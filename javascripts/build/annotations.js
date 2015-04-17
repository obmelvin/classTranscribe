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
    //setVideoFromUrl();
    begin();

    React.render(
        React.createElement(AnnotationBox, {url: "/api/loadAnnotations"}),
        $('.existing-annotations-container')[0]
        //document.getElementById('existing-annotations-container')
    );
});

/*
 Started once the DOM finishes loading
 */
function begin() {
    var videoIndex = parseInt($(".video-selector").val(), 10);

    loadCaptions(videoIndex);
    //loadExistingAnnotations();
    bindEventListeners();
}


var Annotation = React.createClass({displayName: "Annotation",
    render: function() {
        return (
            React.createElement("div", null, 
                React.createElement("p", null, this.props.children), 
                React.createElement("div", {className: "icon-action-black icon-action-black-ic_done_black_24dp"})
            )
        );
    }
});

var AnnotationList = React.createClass({displayName: "AnnotationList",
   render: function() {
       var annotationNodes = this.props.data.map(function (annotation) {
           return (
               React.createElement(Annotation, {key: annotation.id, annotationID: annotation.id, creator: annotation.userID}, 
                   annotation.content
               )
           );
       });
       return (
           React.createElement("div", {className: "assignmentList"}, 
               annotationNodes
           )
       );
   }
});

var CreateAnnotationBox = React.createClass({displayName: "CreateAnnotationBox",
    render: function() {
        return (
            React.createElement("div", {className: "createAnnotationBox"}, 
                React.createElement("textarea", {class: "annotation-textarea"}), 
                React.createElement("button", {class: "add-annotation-button"}, "Add an annotation at the current time")
            )
        );
    }
});

var AnnotationBox = React.createClass({displayName: "AnnotationBox",
    getInitialState: function() {
        return {data: []};
    },
    componentDidMount: function() {
        var self = this;
        var videoName = $(".video-selector option:selected").text();
        $.get(self.props.url, {video: videoName}, function(annotationData) {
            self.setState({data: annotationData});
        })
    },
    render: function() {
        return (
            React.createElement("div", {className: "annotationBox"}, 
                React.createElement("h3", null, "Existing Annotations"), 
                React.createElement(AnnotationList, {data: this.state.data})
            )
        );
    }
});

function loadExistingAnnotations() {
    var videoName = $(".video-selector option:selected").text();
    $.get("/api/loadAnnotations", { video: videoName }, function(annotations) {
        annotations.forEach(function(annotation, index, array) {
            $(".existing-annotations-container").append('<div class="annotation" id="' + annotation.id + '">' +
            annotation.content + '</div>');
        })
    });
}

/*
 Binds event listeners on input elements
 */
function bindEventListeners() {
    $(".add-annotation-button").click(addAnnotation);
}

/*
 Adds annotation to the DB tied to the current video time
 */
function addAnnotation() {
    var annotationTextarea = $(".annotation-textarea");
    var video = $(".main-video").get(0);
    var videoName = $(".video-selector option:selected").text();
    $.ajax({
        method: "PUT",
        url: "/api/addAnnotation",
        data: { content: annotationTextarea.val(), time: video.currentTime, video: videoName }
    }).done(function(data) {
        annotationTextarea.val('');
    });
}