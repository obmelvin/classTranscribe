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