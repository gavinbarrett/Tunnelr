import * as React from 'react';
import './sass/LandingPage.scss';

const LandingText = () => {
	return (<div id="landing-text">
		{"Type securely with Tunnlr"}
	</div>);
}

const SignUp = () => {
	return (<div id="sign-up">
		{"sign up"}
	</div>);
}

export const LandingPage = () => {
	return (<div id="landing-page">
		<LandingText/>
		<SignUp/>
	</div>);
}
