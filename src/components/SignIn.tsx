import * as React from 'react';
import './sass/SignIn.scss';

export const SignIn = () => {
	const [username, updateUsername] = React.useState('');
	const [password, updatePassword] = React.useState('');
	const attemptSignIn = async () => {
		const resp = await fetch("/signin", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"user": username, "pass": password}) });
		const r = await resp.json();
		console.log(r);
	}
	return (<div id="signin-wrapper">
		<div id="signin-box">
			<div id="signin-title">Sign In</div>
			<label for="username">Username</label>
			<input name="username" placeholder={"enter username"} onChange={e => updateUsername(e.target.value)}/>
			<label for="password">Password</label>
			<input name="password" placeholder={"enter password"} onChange={e => updatePassword(e.target.value)}/>
			<input type="submit" onClick={attemptSignIn}/>
		</div>
	</div>);
}
