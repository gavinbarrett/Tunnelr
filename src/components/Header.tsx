import * as React from 'react';
import * as Router from 'react-router-dom';
import './sass/Header.scss';

export const Header = ({user, loggedIn}) => {
	return (<header>
		<Router.Link id="home-link" to="/">Tunnelr</Router.Link>
		<div id="header-links">
			{loggedIn ? <><Router.Link to="/chat">{"Chat"}</Router.Link>
			<Router.Link to={`/account/${user}`}>
				<p id="header-name" title={user}>{user}</p>
			</Router.Link></> : <Router.Link id="sign-in" to="/signin">{"Sign In"}</Router.Link>}
		</div>
	</header>);
}