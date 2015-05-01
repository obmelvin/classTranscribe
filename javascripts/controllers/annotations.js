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
        <AnnotationBox url="/api/loadAnnotations" />,
        $('.existing-annotations-container')[0]
        //document.getElementById('existing-annotations-container')
    );

    React.render(
        <CreateAnnotationBox />,
        $('.create-annotations-container')[0]
    )
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


var Annotation = React.createClass({
    render: function() {
        return (
        <div className="annotation card blue-grey lighten-2">
            <div className="card-content">
                <span className="card-title white-text">{this.props.author}</span>
                <p>{this.props.children}</p>
            </div>
            <div className="card-action">
                <i className="mdi-action-done right"></i>
            </div>
        </div>
        );
    }
});

var AnnotationList = React.createClass({
   render: function() {
       var annotationNodes = this.props.data.map(function (annotation) {
           return (
               <Annotation key={annotation.id} annotationID={annotation.id} creator={annotation.userID}>
                   {annotation.content}
               </Annotation>
           );
       });
       return (
           <div className="assignmentList">
               {annotationNodes}
           </div>
       );
   }
});

var CreateAnnotationBox = React.createClass({
    render: function() {
        return (
            <div className="createAnnotationBox">
                <div className="input-field">
                    <textarea id="add-annotation-textarea" className="annotation-textarea materialize-textarea"></textarea>
                    <label htmlFor="add-annotation-textarea">Create an Official Annotation</label>
                </div>

                <a className="add-annotation-button waves-effect waves-light btn">Add an annotation at the current time</a>
            </div>
        );
    }
});

var AnnotationBox = React.createClass({
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
            <div className="annotationBox">
                <h3>Existing Annotations</h3>
                <AnnotationList data={this.state.data} />
            </div>
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