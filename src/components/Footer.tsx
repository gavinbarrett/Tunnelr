import * as React from 'react';
import './sass/Footer.scss';

export const Footer = () => {
	return (<footer>
		<div id="footer-wrapper">
			<div className="footer-box">
				<p>{"Tunnelr"}</p>
				<p>{"Home"}</p>
				<p>{"SignIn"}</p>
				<p>{"SignUp"}</p>
			</div>
			<div className="footer-box">
				<p>{"About"}</p>
				<p>{"Source"}</p>
				<p>{"Contact"}</p>
				<p>{"Tunnelr \u00A9 2021"}</p>
			</div>
		</div>
	</footer>);
}
