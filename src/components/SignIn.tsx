import * as React from 'react';
import * as Router from 'react-router-dom';
import { updateDataStore } from './dataStore';
import { ErrorMessage } from './ErrorMessage';
import { Footer } from './Footer';
import { UserAuth } from '../UserAuth';
import { Messages } from '../Messages';
import './sass/SignIn.scss';

export const SignIn = () => {
	const { updateLoggedIn, updateUser } = React.useContext(UserAuth);
	const [username, updateUsername] = React.useState('');
	const [password, updatePassword] = React.useState('');
	const [errorDisplayed, updateErrorDisplayed] = React.useState(false);
	const { updateErrorMessage } = React.useContext(Messages);
	const history = Router.useHistory();
	const reg = /^[a-z0-9]{2,64}$/i;
	const attemptSignIn = async () => {
		/* attempt to sign in to the app */
		if (validCredentials()) {
			const resp = await fetch("/signin", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"user": username, "pass": password}) });
			if (resp.status == 200) {
				const r = await resp.json();
				updateLoggedIn(true);
				updateUser(r["user"]);
				history.push("/");
			} else {
				updateErrorMessage('Incorrect credentials');
				updateErrorDisplayed(true);
			}
		}
	}
	const validCredentials = () => {
		/* enforce alphanumeric usernames and passwords */
		if (!username.match(reg)) {
			updateErrorMessage('Username is not valid');
			updateErrorDisplayed(true);
			return false;
		} else if (!password.match(reg)) {
			updateErrorMessage('Password is not valid');
			updateErrorDisplayed(true);
			return false;
		} else return true;
	}
	return (<><div id="signin-wrapper">
		<div id="signin-box">
			<div id="signin-title">
				<ErrorMessage displayed={errorDisplayed} updateDisplayed={updateErrorDisplayed}/>
			</div>
			<label htmlFor="username">Username</label>
			<input name="username" maxLength={64} placeholder={"enter username"} autoComplete={"off"} onChange={e => updateUsername(e.target.value)}/>
			<label htmlFor="password">Password</label>
			<input name="password" maxLength={64} placeholder={"enter password"} autoComplete={"off"} type={"password"} onChange={e => updatePassword(e.target.value)}/>
			<div id="no-account">
				<Router.Link to="/signup">{"Don't have an account? Sign Up Now!"}</Router.Link>
			</div>
			<button onClick={attemptSignIn}>{"Sign In"}</button>
		</div>
	</div>
	<Footer/></>);
}