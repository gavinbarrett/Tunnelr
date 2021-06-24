import * as React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import './sass/Account.scss';

export const Account = ({user, updateUser, updateLoggedIn, profile, updateProfile}) => {
	const [name, updateName] = React.useState('');
	const [self, updateSelf] = React.useState(true);
	const [initRender, updateInitRender] = React.useState(true);
	const [joinedDate, updateJoinedDate] = React.useState(null);
	const [friendsList, updateFriendsList] = React.useState([]);
	const loc = useLocation();
	React.useEffect(() => {
		const username = loc.pathname.split('/')[2];
		// FIXME: download user's account data
		console.log(`Username: ${username}\nUser: ${user}`);
		if (username) {
			updateName(username);
		} else
			return;
		console.log(`Name: ${name}\nUser: ${user.user}`);
		// FIXME: grab account info - profile pic, joined date, and friends list
		if (!initRender)
			grabUserInfo(name);
		else
			updateInitRender(false);
		return () => {
			updateInitRender(true);
		}
	}, [name]);
	const grabUserInfo = async name => {
		const resp = await fetch(`/loaduserinfo/?name=${name}`, {method: 'GET'});
		const r = await resp.json();
		const created_date = r["created_at"].split(' ');
		const date = created_date.splice(1, 4);
		// set joined date
		updateJoinedDate(date.join(' '));
		const profilepic = r['profile'];
		// set profile picture
		if (profilepic) updateProfile(`data:image/png;base64,${profilepic}`);
	}
	return (<><div id="account-page">
		<div id="side">
			{name === user ? <Selector updateSelf={updateSelf} updateUser={updateUser} updateLoggedIn={updateLoggedIn} name={name} user={user}/> : ''}
		</div>
		{self ? <HomePage name={name} user={user} joinedDate={joinedDate} friendsList={friendsList} profile={profile}/> : <Settings name={name}/>}
	</div>
	<Footer/></>);
}

const FriendsList = ({friendsList}) => {
	return (<div id="friends-list">
		{"Friends"}
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

const HomePage = ({name, user, joinedDate, friendsList, profile}) => {
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
			{name != user ? <FriendStatus name={name} friend={user}/> : ''}
		</div>
		<div id="account-friends">
			<FriendsList friendsList={friendsList}/>
		</div>
	</div>);
}

const JoinedDate = ({date}) => {
	return (<div id="joined-date">
		{date}
	</div>);
}

const AccountController = () => {
	const changePassword = async () => {}
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
		// FIXME: pull new profile picture
	}
	const leaveChannel = async () => {}
	const deleteChannel = async () => {}
	const deleteAccount = async () => {}
	return (<div id="account-controller">
		<button id="change-password">{"Change Password"}</button>
		<label for="profile-uploader" id="change-profile">{"Change Profile"}</label>
		<input id="profile-uploader" type="file" accept="image/*" onChange={changeProfile}/>
		<button id="leave-channel">{"Leave Channel"}</button>
		<button id="delete-channel">{"Delete Channel"}</button>
		<button id="delete-account">{"Delete Account"}</button>
	</div>);
}

const Settings = name => {
	return (<div id="settings-page">
		<AccountController/>
	</div>);
}

const FriendStatus = ({name, friend}) => {
	return (<div id="befriend">{"Add Friend"}</div>);
}