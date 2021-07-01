import * as React from 'react';
import * as Router from 'react-router-dom';
import { updateDataStore } from './dataStore';
import { Footer } from './Footer';
import { UserAuth } from '../UserAuth';
import './sass/SignUp.scss';

export const SignUp = () => {
	const { updateLoggedIn, updateUser } = React.useContext(UserAuth);
	const [username, updateUsername] = React.useState('');
	const [password, updatePassword] = React.useState('');
	const [rePassword, updateRePassword] = React.useState('');
	const [email, updateEmail] = React.useState('');
	const pageHistory = Router.useHistory();
	const userRegex = /^[a-z0-9]+$/i;
	const emailRegex = /^[a-z0-9]+@\.[a-z]$/i;

	const attemptSignUp = async () => {
		/* attempt to sign the user up for Tunnelr */
		if (await validCredentials()) {
			const resp = await fetch("/signup", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"user": username, "pass": password, "email": email})});
			const r = await resp.json();
			if (r["status"] === "failed") return;
			const user = r["status"];
			let logged = true;
			updateLoggedIn(true);
			updateUser(r["status"]);
			updateDataStore("data", JSON.stringify({"user": user, "loggedin": logged}));
			pageHistory.push("/");
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
			<div id="signup-title"></div>
			<label htmlFor="username">Username</label>
			<input name="username" placeholder={"enter username"} autoComplete={"off"} onChange={e => updateUsername(e.target.value)}/>
			<label htmlFor="password">Password</label>
			<input name="password" placeholder={"enter password"} autoComplete={"off"} type={"password"} onChange={e => updatePassword(e.target.value)}/>
			<label htmlFor="rePassword">Re-enter Password</label>
			<input name="rePassword" placeholder={"enter password"} autoComplete={"off"} type={"password"} onChange={e => updateRePassword(e.target.value)}/>
			<label hmltFor="email">Email</label>
			<input name="email" placeholder={"enter email"} autoComplete={"off"} onChange={e => updateEmail(e.target.value)}/>
			<button onClick={attemptSignUp}>{"Sign Up"}</button>
		</div>
	</div>
	<Footer/></>);
}
