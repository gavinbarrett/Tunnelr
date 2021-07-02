import * as React from 'react';
import './sass/ChangePassword.scss';

export const ChangePassword = ({updatePrompt}) => {
	const [oldPass, updateOldPass] = React.useState('');
	const [newPass, updateNewPass] = React.useState('');
	const [retryPass, updateRetryPass] = React.useState('');
	const [pwError, udpatePWError] = React.useState('');
	const validPassword = pass => pass.match(/^[a-z0-9]{10,64}$/i);
	const tryNewPassword = async () => {
		console.log(`old: ${oldPass}\nnew: ${newPass}\nretry: ${retryPass}`);
		if (oldPass == '') {
			udpatePWError('Please enter your old password');
			return;
		} else if (newPass == '') {
			udpatePWError('Please enter a new password');
			return;
		} else if (retryPass == '') {
			udpatePWError('Please re-enter your new password');
			return;
		} else if (newPass != retryPass) {
			udpatePWError('New passwords do not match');
			return;
		}
		if (!validPassword(newPass)) {
			udpatePWError('Invalid password [A-Z0-9]');
			return;
		}
		const resp = await fetch('/changepassword', {method: 'POST', headers: {"Content-Type": "application/json"}, body: JSON.stringify({"oldpassword": oldPass, "newpassword": newPass})});
		if (resp.status == 200) {
			// successfully changed password; clear variables
			clearVariables();
		} else
			udpatePWError('Could not change password');
	}
	const clearVariables = async () => {
		udpatePWError('');
		updateOldPass('');
		updateNewPass('');
		updateRetryPass('');
		updatePrompt(null);
	}
	return (<div className={`settings-prompt password-prompt`}>
		<div id="exit" onClick={clearVariables}>{"x"}</div>
		<div className="error-container">
			{pwError ? <div className="ui-error">{pwError}</div> : ''}
		</div>
		<label for="oldpw">{"Enter old password"}</label>
		<input name="oldpw" onChange={event => updateOldPass(event.target.value)}/>
		<label for="newpw">{"Enter new password"}</label>
		<input name="newpw" onChange={event => updateNewPass(event.target.value)}/>
		<label for="newpwretry">{"Retype new password"}</label>
		<input name="newpwretry" onChange={event => updateRetryPass(event.target.value)}/>
		<button onClick={tryNewPassword}>{"Change Password"}</button>
	</div>);
}