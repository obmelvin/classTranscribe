(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
exports.annotation = Annotation;

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
exports.annotationList = AnnotationList;

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
exports.createAnnotationBox = CreateAnnotationBox;

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
exports.annotationBox = AnnotationBox;
},{}],2:[function(require,module,exports){
/*
 Begin Global Variables
 */
// Time that current segment started
var lastTime = -1;
// Length of current segment
var segmentLength = 0;

var annotationComponents = require('./annotationReactComponents');
/*
 End Global Variables
 */

$(document).ready(function () {
    //setVideoFromUrl();
    begin();

    React.render(
        React.createElement(annotationComponents.annotationBox, {url: "/api/loadAnnotations"}),
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
},{"./annotationReactComponents":1}]},{},[1,2]);
