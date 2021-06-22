import * as React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import '../../dist/blank.png'
import './sass/Account.scss';

export const Account = ({user, updateUser, updateLoggedIn}) => {
	const [name, updateName] = React.useState('');
	const [self, updateSelf] = React.useState(true);
	const loc = useLocation();

	React.useEffect(() => {
		const username = loc.pathname.split('/')[2];
		// FIXME: download user's account data
		console.log(`Username: ${username}\nUser: ${user}`);
		if (username) {
			updateName(username);
		} else
			return;
		if (username === user.user) {
			// FIXME: retrieve self data
			console.log(`Usernames match.`);
		} else {
			// FIXME: retrieve another's data
			console.log(`Usernames do not match.`);
		}
	}, []);

	return (<><div id="account-page">
		<div id="side">
			{name === user ? <Selector updateSelf={updateSelf} updateUser={updateUser} updateLoggedIn={updateLoggedIn} name={name} user={user}/> : ''}
		</div>
		{self ? <HomePage name={name} user={user}/> : <Settings name={name}/>}
	</div>
	<Footer/></>);
}

const FriendsList = () => {
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

const HomePage = ({name, user}) => {
	const [initRender, updateInitRender] = React.useState(true);
	const [joinedDate, updateJoinedDate] = React.useState(null);
	React.useEffect(() => {
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
		console.log(`r: ${r["joined"]}`);
		updateJoinedDate(r["joined"]);
	}
	return (<div id="account-wrapper">
		<div id="account-home">
			<div id="account-name">
				{name}
			</div>
			<div id="account-pic">
				<div id="pic-container">
					<img id="profile" src="blank.png"></img>
				</div>
			</div>
			<div id="account-date">{`Joined: ${joinedDate}`}</div>
			{name != user ? <FriendStatus name={name} friend={user}/> : ''}
		</div>
		<div id="account-friends">
			<div id="friends-list">
				{"Friends"}
			</div>
		</div>
	</div>);
}

const JoinedDate = ({date}) => {
	return (<div id="joined-date">
		{date}
	</div>);
}

const AccountController = () => {
	return (<div id="account-controller">
		<button id="change-password">{"Change Password"}</button>
		<button id="change-profile">{"Change Profile"}</button>
		<button id="leave-channel">{"Leave Channel"}</button>
		<button id="delete-channel">{"Delete Channel"}</button>
		<button id="delete-account">{"Delete Account"}</button>
	</div>);
}

const Settings = name => {
	return (<div id="settings-page">
		<JoinedDate date={'XX-XX-XXXX'}/>
		<AccountController/>
	</div>);
}

const FriendStatus = ({name, friend}) => {
	return (<div id="befriend">{"Add Friend"}</div>);
}