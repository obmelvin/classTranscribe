/**
 * Created by omelvin on 4/30/15.
 */

var Footer = React.createClass({
    render: function() {
        return (
            <footer className="page-footer indigo darken-4 grey-text text-lighten-3">
                <div className="container">
                    <div className="row">
                        <div className="col l6 s12">
                            <h5>Class Transcribe</h5>
                        </div>
                        <div className="col l4 offset-l2 s12">
                            <h5>Links</h5>
                            <ul>
                                <li>Please send feedback to: <a href="mailto:classtransribe@gmail.com">classtranscribe@gmail.com</a></li>
                                <li><a href="http://classtranscribe.com/">Live Site</a></li>
                                <li><a href="https://github.com/cs-education/classTranscribe">Main Repo</a></li>
                                <li><a href="https://github.com/obmelvin/classTranscribe">Oliver's 242 Forked Repo</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="footer-copyright">
                    <div className="footer-creator-container">
                        <p>Created by Bob Ren, Oliver Melvin and Surtai Han</p>
                    </div>
                </div>
            </footer>
        );
    }
});


$(document).ready( function() {
    React.render(
        <Footer />,
        $(".footer-container")[0]
    );
});
