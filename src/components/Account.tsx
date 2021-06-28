import { load } from 'dotenv/types';
import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { Footer } from './Footer';
import { UserAuth } from '../UserAuth';
import './sass/Account.scss';

export const Account = () => {
	const { user, updateUser, updateLoggedIn, profile, updateProfile, loc } = React.useContext(UserAuth);
	const [name, updateName] = React.useState(null);
	const [self, updateSelf] = React.useState(true);
	const [joinedDate, updateJoinedDate] = React.useState(null);
	const [friendsList, updateFriendsList] = React.useState([]);
	React.useEffect(() => {
		loadAccount();
	}, [loc]);
	const loadAccount = async () => {
		const username = loc.pathname.split('/')[2];
		// FIXME: download user's account data
		console.log(`Username: ${username}`);
		if (username) {
			updateName(username);
			grabUserInfo(username);
		}
	}
	const grabUserInfo = async name => {
		console.log(`Grabbing ${name}`);
		const resp = await fetch(`/loaduserinfo/?name=${name}`, {method: 'GET'});
		const r = await resp.json();
		const created_date = r["created_at"].split(' ');
		const date = created_date.splice(1, 4);
		// set joined date
		updateJoinedDate(date.join(' '));
		const profilepic = r['profile'];
		// set profile picture
		(profilepic == "null") ? updateProfile('images/blank.png') : updateProfile(`data:image/png;base64,${profilepic}`);
		if (!r['friends']) return;
		updateFriendsList(r['friends']);
	}
	return (<><div id="account-page">
		<div id="side">
			{name === user ? <Selector updateSelf={updateSelf} updateUser={updateUser} updateLoggedIn={updateLoggedIn} name={name} user={user}/> : ''}
		</div>
		{self ? <HomePage name={name} user={user} joinedDate={joinedDate} friendsList={friendsList} profile={profile} updateName={updateName}/> : <Settings name={name}/>}
	</div>
	<Footer/></>);
}

const FriendsList = ({friendsList, updateName}) => {
	const history = useHistory();
	const showUser = async user => {
		updateName(user);
		history.push(`/account/${user}`);
	}
	return (<div id="friends-list">
		<p id="friends-header">{"Friends"}</p>
		<div id="friend-wrapper">
			{friendsList.length ? friendsList.map((elem, id) => {
				console.log(elem);
				return <p className="friend-slide" onClick={() => showUser(elem.friend)}>{elem.friend}</p>
			}) : <p id="no-friends">{""}</p>}
		</div>
	</div>);
}

const Selector = ({updateSelf, updateUser, updateLoggedIn, name, user}) => {
	const hist = useHistory();
	const logUserOut = async () => {
		console.log(`Logging out ${user.user}`);
		const resp = await fetch('/logout', {method: "GET"});
		const r = await resp.json();
		console.log(r);
		if (r["status"] === "logged out") {
			// log user out of front end
			updateUser('');
			updateLoggedIn(false);
			document.cookie = "";
			// return to the landing page
			hist.push('/');
		}
	}
	return (<div id="self-sidebar"><div id="homepage" onClick={() => updateSelf(true)}>
		{"Home Page"}
	</div>
	<div id="settings" onClick={() => updateSelf(false)}>
		{"Settings"}
	</div>
	<div id="logout" onClick={logUserOut}>
		{"Log Out"}
	</div>
	</div>);
}

const HomePage = ({name, user, joinedDate, friendsList, profile, updateName}) => {
	return (<div id="account-wrapper">
		<div id="account-home">
			<div id="account-name">
				{name}
			</div>
			<div id="account-pic">
				<div id="pic-container">
					<img id="profile" src={profile} accept={'image/*'}/>
				</div>
			</div>
			<div id="account-date">{`Joined: ${joinedDate}`}</div>
			{name != user ? <FriendStatus name={name} friend={user} friendsList={friendsList}/> : ''}
		</div>
		<div id="account-friends">
			<FriendsList friendsList={friendsList} updateName={updateName}/>
		</div>
	</div>);
}

const JoinedDate = ({date}) => {
	return (<div id="joined-date">
		{date}
	</div>);
}

const AccountController = ({passwordPrompt, updatePasswordPrompt, updatePrompt}) => {
	const changePassword = async () => {
		updatePrompt(<ChangePassword passwordPrompt={passwordPrompt} updatePasswordPrompt={updatePasswordPrompt}/>);
		updatePasswordPrompt('visible-prompt');
	}
	const changeProfile = async event => {
		const file = event.target.files[0];
		if (!file) return;
		const formData = new FormData();
		formData.append('profile', file);
		// try to upload profile picture
		const resp = await fetch('/uploaduserprofile', {method: 'PUT', body: formData});
		console.log(resp);
		const r = await resp.json();
		console.log(r);
		// FIXME: return profile pic from the server and load into view
	}
	const deleteChannel = async () => {}
	const deleteAccount = async () => {}
	return (<div id="account-controller">
		<button id="change-password" onClick={changePassword}>{"Change Password"}</button>
		<label for="profile-uploader" id="change-profile">{"Change Profile"}</label>
		<input id="profile-uploader" type="file" accept="image/*" onChange={changeProfile}/>
		<button id="delete-channel">{"Delete Channel"}</button>
		<button id="delete-account">{"Delete Account"}</button>
	</div>);
}

const SettingsPrompt = ({activePrompt}) => {
	return (<div className={`settings-prompt ${activePrompt}`}>
		{"This is the prompt overlay"}
	</div>);
}

const ChangePassword = ({passwordPrompt, updatePasswordPrompt}) => {
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
		const r = await resp.json();
		if (r["status"] == "success") {
			// successfully changed password; clear variables
			clearVariables();
		} else
			udpatePWError('Could not change password');
	}
	const clearVariables = async () => {
		updatePasswordPrompt('');
		udpatePWError('');
		updateOldPass('');
		updateNewPass('');
		updateRetryPass('');
	}
	return (<div className={`settings-prompt ${passwordPrompt}`}>
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

const DeleteChannel = () => {}

const DeleteAccount = () => {}

const Settings = name => {
	const [passwordPrompt, updatePasswordPrompt] = React.useState('');
	const [prompt, updatePrompt] = React.useState(null);
	return (<div id="settings-page">
		<AccountController passwordPrompt={passwordPrompt} updatePasswordPrompt={updatePasswordPrompt} updatePrompt={updatePrompt}/>
		<ChangePassword passwordPrompt={passwordPrompt} updatePasswordPrompt={updatePasswordPrompt}/>
	</div>);
}

const FriendStatus = ({name, friend, friendsList}) => {
	const [status, updateStatus] = React.useState('Befriend');
	React.useEffect(() => {
		friendsList.map((elem, id) => {
			console.log(elem);
			console.log(friend);
			if (friend == elem['friend']) updateStatus('Friended \u2713');
		});
	}, [friendsList]);
	return (<div id="befriend">
		<button id="befriend-button">
			{status}
		</button>
	</div>);
}