import * as React from 'react';
import { Footer } from './Footer';
import './sass/SignUp.scss';

export const SignUp = () => {
	const [username, updateUsername] = React.useState('');
	const [password, updatePassword] = React.useState('');
	const [rePassword, updateRePassword] = React.useState('');
	const [email, updateEmail] = React.useState('');
	const userRegex = /^[a-z0-9]+$/i;
	const emailRegex = /^[a-z0-9]+@\.[a-z]$/i;

	const attemptSignUp = async () => {
		/* attempt to sign the user up for Tunnelr */
		if (await validCredentials()) {
			const resp = await fetch("/signup", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"user": username, "pass": password, "email": email})});
			const r = await resp.json();
			console.log(r);
		} else {
			// FIXME: update the Error component with the correct error
			console.log("Credentials are not valid");
		}
	}

	const validCredentials = async () => {
		return new Promise((resolve, reject) => {
			if (!username.match(userRegex)) {
				console.log('Username invalid.');
				resolve(false);
			} else if (!password.match(userRegex)) {
				console.log('Password invalid.');
				resolve(false);
			} else {
				resolve(true);
			}
		});
	}

	return (<><div id="signup-wrapper">
		<div id="signup-box">
			<div id="signup-title">
				<div id="title-box">{"Sign Up"}</div>
				<div id="error-box"></div>
			</div>
			<label for="username">Username</label>
			<input name="username" placeholder={"enter username"} autoComplete={"off"} onChange={e => updateUsername(e.target.value)}/>
			<label for="password">Password</label>
			<input name="password" placeholder={"enter password"} autoComplete={"off"} type={"password"} onChange={e => updatePassword(e.target.value)}/>
			<label for="rePassword">Re-enter Password</label>
			<input name="rePassword" placeholder={"enter password"} autoComplete={"off"} type={"password"} onChange={e => updateRePassword(e.target.value)}/>
			<label for="email">Email</label>
			<input name="email" placeholder={"enter email"} autoComplete={"off"} onChange={e => updateEmail(e.target.value)}/>
			<button onClick={attemptSignUp}>{"Sign Up"}</button>
		</div>
	</div>
	<Footer/></>);
}
