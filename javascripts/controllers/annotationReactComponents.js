var Annotation = React.createClass({
    render: function() {
        return (
            <div>
                <p>{this.props.children}</p>
                <div className="icon-action-black icon-action-black-ic_done_black_24dp"></div>
            </div>
        );
    }
});
exports.annotation = Annotation;

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
exports.annotationList = AnnotationList;

var CreateAnnotationBox = React.createClass({
    render: function() {
        return (
            <div className="createAnnotationBox">
                <textarea class="annotation-textarea"></textarea>
                <button class="add-annotation-button">Add an annotation at the current time</button>
            </div>
        );
    }
});
exports.createAnnotationBox = CreateAnnotationBox;

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
exports.annotationBox = AnnotationBox;