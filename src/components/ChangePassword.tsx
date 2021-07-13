import * as React from 'react';
import { ErrorMessage } from './ErrorMessage';
import { Messages } from '../Messages';
import './sass/ChangePassword.scss';

export const ChangePassword = ({updatePrompt}) => {
	const [oldPass, updateOldPass] = React.useState<string>('');
	const [newPass, updateNewPass] = React.useState<string>('');
	const [retryPass, updateRetryPass] = React.useState<string>('');
	const [errorDisplayed, updateErrorDisplayed] = React.useState<boolean>(false);
	const { updateErrorMessage } = React.useContext(Messages);
	const validPassword = pass => pass.match(/^[a-z0-9]{10,64}$/i);
	const tryNewPassword = async () => {
		if (oldPass == '') {
			updateErrorMessage('Please enter your old password');
			updateErrorDisplayed(true);
		} else if (newPass == '') {
			updateErrorMessage('Please enter a new password');
			updateErrorDisplayed(true);
		} else if (retryPass == '') {
			updateErrorMessage('Please re-enter your new password');
			updateErrorDisplayed(true);
		} else if (newPass != retryPass) {
			updateErrorMessage('New passwords do not match');
			updateErrorDisplayed(true);
		} else if (!validPassword(newPass)) {
			updateErrorMessage('Invalid password [A-Z0-9]');
			updateErrorDisplayed(true);
		} else {
			const resp = await fetch('/changepassword', {method: 'POST', headers: {"Content-Type": "application/json"}, body: JSON.stringify({"oldpassword": oldPass, "newpassword": newPass})});
			if (resp.status == 200) {
				// successfully changed password; clear variables
				clearVariables();
			} else
				updateErrorMessage('Could not change password');
		}
	}
	const clearVariables = async () => {
		// reset all component variables
		updateErrorMessage('');
		updateErrorDisplayed(false);
		updateOldPass('');
		updateNewPass('');
		updateRetryPass('');
		updatePrompt(null);
	}
	return (<div className={`settings-prompt password-prompt`}>
		<div id="exit" onClick={clearVariables}>{"x"}</div>
		<div className="error-container">
			<ErrorMessage displayed={errorDisplayed} updateDisplayed={updateErrorDisplayed}/>
		</div>
		<div id="set-new-pass">{"Set a new password"}</div>
		<label for="oldpw" className="settings-label">{"Enter old password"}</label>
		<input name="oldpw" maxLength={64} onChange={event => updateOldPass(event.target.value)}/>
		<label for="newpw" className="settings-label">{"Enter new password"}</label>
		<input name="newpw" maxLength={64} onChange={event => updateNewPass(event.target.value)}/>
		<label for="newpwretry" className="settings-label">{"Retype new password"}</label>
		<input name="newpwretry" maxLength={64} onChange={event => updateRetryPass(event.target.value)}/>
		<button onClick={tryNewPassword}>{"Change Password"}</button>
	</div>);
}