import * as React from 'react';
import * as Router from 'react-router-dom';
import './sass/Footer.scss';

export const Footer = () => {
	return (<footer>
		<div id="footer-wrapper">
			<div className="footer-box">
				{/*<p>{"Tunnelr"}</p>*/}
				<Router.Link to="/">{"Home"}</Router.Link>
				<Router.Link to="/signup">{"SignUp"}</Router.Link>
				<Router.Link to="/signin">{"SignIn"}</Router.Link>
			</div>
			<div className="footer-box">
				{/*<p>{"About"}</p>*/}
				<a href="https://github.com/gavinbarrett/Tunnelr">{"Source"}</a>
				<Router.Link to="/contact">{"Contact"}</Router.Link>
				<p>{"Tunnelr \u00A9 2021"}</p>
			</div>
		</div>
	</footer>);
}
