import * as React from 'react';
import * as Router from 'react-router-dom';
import './sass/LandingPage.scss';

const LandingText = () => {
	return (<div id="landing-text">
		{"Type securely with Tunnelr"}
	</div>);
}

const SignUp = () => {
	return (<div id="sign-up">
		<button id="signup-button">
			<Router.Link to="/signup">{"sign up"}</Router.Link>
		</button>
	</div>);
}

export const LandingPage = () => {
	return (<div id="landing-page">
		<LandingText/>
		<SignUp/>
	</div>);
}
