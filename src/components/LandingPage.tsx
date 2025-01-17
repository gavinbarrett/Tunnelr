import * as React from 'react';
import * as Router from 'react-router-dom';
import * as Typewriter from 'react-typewriter';
import { Footer } from './Footer';
import { UserInfo } from '../UserInfo';
import { Messages } from '../Messages';
import './sass/LandingPage.scss';

const LandingText = ({loggedIn}) => {
	return (<div id="landing-text">
		<p id="landing-tag">
			{loggedIn ? 'Type securely with Tunnelr'
			: <Typewriter typing={1} initDelay={10}>{"Type securely with Tunnelr"}</Typewriter>}
		</p>
	</div>);
}

const SignUp = ({loggedIn}) => {
	return (<div id="sign-up">
		{loggedIn ? "" :
		<button id="signup-button">
			<Router.Link to="/signup">{"Sign Up"}</Router.Link>
		</button>}
	</div>);
}

export const LandingPage = () => {
	const { loggedIn } = React.useContext(UserInfo);
	const { landingMessage } = React.useContext(Messages);
	return (<><div id="landing-box">
		<div id="landing-message">{landingMessage}</div>
		<div id="landing-page">
			<LandingText loggedIn={loggedIn}/>
			<SignUp loggedIn={loggedIn}/>
		</div>
	</div>
	<Footer/></>);
}