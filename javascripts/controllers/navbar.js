
var NavBar = React.createClass({
    //getInitialState: function() {
    //    return {value: this.props.data.content};
    //},
    render: function() {
        return (
            <nav>
                <div className="nav-wrapper indigo darken-4 grey-text text-lighten-3">
                    <a href="#" className="brand-logo center grey-text text-lighten-3">Class Transcribe</a>
                    <ul id="nav-mobile" className="left hide-on-med-and-down grey-text text-lighten-3">
                        <li><a className="grey-text text-lighten-3" href="viewer.html">Viewer</a></li>
                        <li><a className="grey-text text-lighten-3" href="components.html">First</a></li>
                        <li><a className="grey-text text-lighten-3" href="javascript.html">JavaScript</a></li>
                    </ul>
                    <ul className="right hide-on-med-and-down">
                        <li>
                            <form>
                                <div className="input-field grey-text text-lighten-3">
                                    <input id="search" type="search" required/>
                                    <label htmlFor="search grey-text text-lighten-3"><i className="mdi-action-search"></i></label>
                                    <i className="mdi-navigation-close"></i>
                                </div>
                            </form>
                        </li>
                    </ul>
                </div>
            </nav>
        )
    }
});

$(document).ready( function() {
    React.render(
        <NavBar />,
        $(".nav-bar-container")[0]
    );
});
