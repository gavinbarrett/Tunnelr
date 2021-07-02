import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { UserAuth } from '../UserAuth';
import './sass/DeleteAccount.scss';

export const DeleteAccount = ({updatePrompt}) => {
    const [username, updateUsername] = React.useState('');
    const [password, updatePassword] = React.useState('');
    const [checked, updateChecked] = React.useState('');
    const [error, updateError] = React.useState('');
    const { updateUser, updateLoggedIn, updateProfile } = React.useContext(UserAuth);
    const history = useHistory();
    const clearVariables = () => {
        updateUsername('');
        updatePassword('');
        updateChecked('');
        updatePrompt(null);
    }
    const flipCheckbox = () => (checked == 'checked') ? updateChecked('') : updateChecked('checked');
    const deleteAccount = async () => {
        // FIXME: perform input validation
        if (username == '') {
            updateError('Please enter your username');
            return;
        } else if (password == '') {
            updateError('Please enter your password');
            return;
        } else if (checked == '') {
            updateError('Please check the box');
            return;
        }
        const resp = await fetch('/deleteaccount', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"username": username, "password": password})});
        if (resp.status == 200) {
            // log user out, reset all variables, return to the landing page
            updateUser('');
            updateLoggedIn(false);
            updateProfile('images/blank.png');
            console.log('Pushing to home');
            history.push("/");
        } else {
            updateError('Could not delete account.');
        }
    }
    return (<div className={`settings-prompt delete-account-prompt`}>
		<div id="exit" onClick={clearVariables}>{"x"}</div>
        <div className="error-container">
            {error ? <div className="ui-error">{error}</div> : ''}
        </div>
        <div id="delete-account-warning">{"Are you sure you want to delete your account?"}</div>
        <label for="username">{"Enter username"}</label>
        <input name="username" type="text" onChange={event => updateUsername(event.target.value)}/>
        <label for="password">{"Enter password"}</label>
        <input name="password" type="text" onChange={event => updatePassword(event.target.value)}/>
        <div id="delete-account-checkbox">
            <label for="account-checkbox">{"Check the box"}</label>
            <input name="account-checkbox" type="checkbox" checked={checked} onChange={flipCheckbox}/>
        </div>
        <button onClick={deleteAccount}>{"Delete Account"}</button>
    </div>);
}