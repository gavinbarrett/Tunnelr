import * as React from 'react';
import * as Router from 'react-router-dom';
import './sass/Header.scss';

export const Header = () => {
	return (<header>
		<Router.Link id="home-link" to="/">Tunnelr</Router.Link>
		<div id="header-links">
			<Router.Link id="chat-link" to="/chat">Chat</Router.Link>
			<Router.Link id="sign-in" to="/signin">Sign In</Router.Link>
		</div>
	</header>);
}
