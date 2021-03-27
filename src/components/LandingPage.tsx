import * as React from 'react';
import * as Router from 'react-router-dom';
import { Footer } from './Footer';
import './sass/LandingPage.scss';

const LandingText = () => {
	return (<div id="landing-text">
		{"Type securely with Tunnelr"}
	</div>);
}

const SignUp = ({loggedIn}) => {
	return (<div id="sign-up">
		{loggedIn ? "" :
		<button id="signup-button">
			<Router.Link to="/signup">{"sign up"}</Router.Link>
		</button>}
	</div>);
}

export const LandingPage = ({loggedIn}) => {
	return (<><div id="landing-page">
		<LandingText/>
		<SignUp loggedIn={loggedIn}/>
	</div>
	<Footer/></>);
}
