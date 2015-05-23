/**
 * Created by omelvin on 5/21/15.
 * @jsx React.DOM
 */


var RegistrationForm = React.createClass({
    getInitialState: function() {
        return {email: this.props.studentID + "@illinois.edu", firstName: '', lastName: '', password: '', confirmedPassword: ''};
    },
    handleEmailChange: function(event) {
        this.setState({email: event.target.value});
    },
    handleFirstNameChange: function(event) {
        this.setState({firstName: event.target.value});
    },
    handleLastNameChange: function(event) {
        this.setState({lastName: event.target.value});
    },
    handlePasswordChange: function(event) {
        this.setState({password: event.target.value});
    },
    handleConfirmedPasswordChange: function(event) {
        this.setState({confirmedPassword: event.target.value});
    },
    handleSubmit: function(e) {
        e.preventDefault();
        alert('hi');

        if (this.state.firstName === '' || this.state.lastName === '' || this.state.password !== this.state.confirmedPassword) {
            //TODO: visual validation
            return;
        }
        $.ajax({
            method: "PUT",
            url: "/api/registerStudent",
            data: { firstName   : this.state.firstName,
                lastName    : this.state.lastName,
                email       : this.state.email,
                password    : this.state.password,
                studentID   : this.props.studentID,
                className   : this.props.className }
        }).done(function(data) {

        });
    },
    render: function () {
        return (
            <form className="u-cf">
                <h2>Register for {this.props.className}</h2>
                <div className="row">
                    <div className="four columns">
                        <label htmlFor="emailInput">Your email</label>
                        <input className="u-full-width" type="email" id="emailInput" value={this.state.email} onChange={this.handleEmailChange}/>
                    </div>
                    <div className="four columns">
                        <label htmlFor="firstNameInput">First Name</label>
                        <input className="u-full-width" type="text" id="firstNameInput" value={this.state.firstName} onChange={this.handleFirstNameChange}/>
                    </div>
                    <div className="four columns">
                        <label htmlFor="lastNameInput">Last Name</label>
                        <input className="u-full-width" type="text" id="lastNameInput" value={this.state.lastName} onChange={this.handleLastNameChange}/>
                    </div>
                </div>
                <div className="row">
                    <div className="six columns">
                        <label htmlFor="passwordInput">Password</label>
                        <input className="u-full-width" type="password" id="passwordInput" value={this.state.password} onChange={this.handlePasswordChange}/>
                    </div>
                    <div className="six columns">
                        <label htmlFor="confirmPasswordInput">Password</label>
                        <input className="u-full-width" type="password" id="confirmPasswordInput" value={this.state.confirmedPassword} onChange={this.handleConfirmedPasswordChange}/>
                    </div>
                </div>
                <button className="registrationSubmit button-primary" type="submit" onClick={this.handleSubmit}>Submit</button>
            </form>
        )
    }
});

//assumes url is of form /:className/register/:studentID
var url = window.location.pathname.split("/");
//0 is blank
var className = url[1];
var studentID = url[3];

React.render(
    <RegistrationForm studentID={studentID} className={className} />,
    document.getElementById('main')
)
