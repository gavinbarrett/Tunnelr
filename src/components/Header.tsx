import * as React from 'react';
import * as Router from 'react-router-dom';
import './sass/Header.scss';

export const Header = () => {
	return (<header>
		<div className="header-text">
			<Router.Link to="/">Tunnlr</Router.Link>
			<Router.Link to="/chat">Chat</Router.Link>
		</div>
	</header>);
}
