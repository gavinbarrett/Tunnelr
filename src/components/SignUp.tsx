import * as React from 'react';
import * as Router from 'react-router-dom';
import { ErrorMessage } from './ErrorMessage';
import { Footer } from './Footer';
import { UserInfo } from '../UserInfo';
import { Messages } from '../Messages';
import './sass/SignUp.scss';

export const SignUp = () => {
	const { updateLoggedIn, updateUser } = React.useContext(UserInfo);
	const [username, updateUsername] = React.useState('');
	const [password, updatePassword] = React.useState('');
	const [rePassword, updateRePassword] = React.useState('');
	const [email, updateEmail] = React.useState('');
	const [errorDisplay, updateErrorDisplay] = React.useState('');
	const { updateErrorMessage, updateLandingMessage } = React.useContext(Messages);
	const pageHistory = Router.useHistory();
	const userRegex = /^[a-z0-9]+$/i;
	const emailRegex = /^[a-z0-9]+@[a-z0-9]+\.[a-z0-9]+$/i;

	const attemptSignUp = async () => {
		/* attempt to sign the user up for Tunnelr */
		if (validCredentials()) {
			const resp = await fetch("/signup", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"user": username, "pass": password, "email": email})});
			console.log(resp.status);
			if (resp.status != 200) {
				updateErrorMessage('Could not sign up');
				updateErrorDisplay(true);
			} else {
				updateLandingMessage('Please verify your account from your email address');
				setTimeout(() => updateLandingMessage(''), 5000);
				pageHistory.push("/");
			}
		}
	}

	const validCredentials = () => {
		if (!username.match(userRegex)) {
			updateErrorMessage('Username is invalid');
			updateErrorDisplay(true);
			return false;
		} else if (!password.match(userRegex)) {
			updateErrorMessage('Password is invalid');
			updateErrorDisplay('true');
			return false;
		} else if (password != rePassword) {
			updateErrorMessage('Passwords do not match');
			updateErrorDisplay(true);
			return false;
		} else if (!email.match(emailRegex)) {
			updateErrorMessage('Email is not valid');
			updateErrorDisplay(true);
			return false;
		} else {
			return true;
		}
	}

	return (<><div id="signup-wrapper">
		<div id="signup-box">
			<div id="signup-title">
				<ErrorMessage displayed={errorDisplay} updateDisplayed={updateErrorDisplay}/>
			</div>
			<label htmlFor="username">Username</label>
			<input name="username" maxLength={64} placeholder={"enter username"} autoComplete={"off"} onChange={e => updateUsername(e.target.value)}/>
			<label htmlFor="password">Password</label>
			<input name="password" maxLength={64} placeholder={"enter password"} autoComplete={"off"} type={"password"} onChange={e => updatePassword(e.target.value)}/>
			<label htmlFor="rePassword">Re-enter Password</label>
			<input name="rePassword" maxLength={64} placeholder={"enter password"} autoComplete={"off"} type={"password"} onChange={e => updateRePassword(e.target.value)}/>
			<label hmltFor="email">Email</label>
			<input name="email" maxLength={64} placeholder={"enter email"} autoComplete={"off"} onChange={e => updateEmail(e.target.value)}/>
			<button onClick={attemptSignUp}>{"Sign Up"}</button>
		</div>
	</div>
	<Footer/></>);
}