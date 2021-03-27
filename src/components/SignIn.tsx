import * as React from 'react';
import * as Router from 'react-router-dom';
import './sass/SignIn.scss';

export const SignIn = ({updateLoggedIn}) => {
	const [username, updateUsername] = React.useState('');
	const [password, updatePassword] = React.useState('');
	const history = Router.useHistory();
	const reg = /^[a-z0-9]+$/i;
	const attemptSignIn = async () => {
		/* attempt to sign in to the app */
		if (await validCredentials()) {
			const resp = await fetch("/signin", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"user": username, "pass": password}) });
			const r = await resp.json();
			console.log(r);
			if (r["status"] === "succeeded")
				updateLoggedIn(true);
				history.push("/chat");
		} else {
			console.log("Creds don't match.");
		}
	}
	const validCredentials = async () => {
		/* enforce alphanumeric usernames and passwords */
		return new Promise((resolve, reject) => {
			if (!username.match(reg) || !password.match(reg)) resolve(false);
			else resolve(true);
		});
	}
	return (<div id="signin-wrapper">
		<div id="signin-box">
			<div id="signin-title">
				<div id="title-box">{"Sign In"}</div>
				<div id="error-box"></div>
			</div>
			<label for="username">Username</label>
			<input name="username" placeholder={"enter username"} autoComplete={"off"} onChange={e => updateUsername(e.target.value)}/>
			<label for="password">Password</label>
			<input name="password" placeholder={"enter password"} autoComplete={"off"} onChange={e => updatePassword(e.target.value)}/>
			<div id="no-account">
				<Router.Link to="/signup">{"Don't have an account? Sign Up Now!"}</Router.Link>
			</div>
			<input type="submit" onClick={attemptSignIn}/>
		</div>
	</div>);
}
