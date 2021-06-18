import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import './sass/Account.scss';

export const Account = user => {
	const [name, updateName] = React.useState('');
	const [self, updateSelf] = React.useState(true);
	const loc = useLocation();

	React.useEffect(() => {
		const username = loc.pathname.split('/')[2];
		// FIXME: download user's account data
		console.log(`Username: ${username}\nUser: ${user.user}`);
		if (username) {
			updateName(username);
		} else
			return;
		//updatePage(<HomePage name={name} user={user.user}/>);
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
			{name === user.user ? <Selector updateSelf={updateSelf} name={name} user={user}/> : ''}
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

const Selector = ({updateSelf, name, user}) => {
	return (<><div id="homepage" onClick={() => updateSelf(true)}>
		{"Home Page"}
	</div>
	<div id="settings" onClick={() => updateSelf(false)}>
		{"Settings"}
	</div>
	</>);
}

const HomePage = ({name, user}) => {
	React.useEffect(() => {
		console.log(`Name: ${name}\nUser: ${user.user}`);
		// FIXME: grab account info - profile pic, joined date, and friends list
		// make an endpoint at /get_account_info/${user}
	}, []);
	return (<div id="account-wrapper">
		<div id="account-home">
			<div id="account-name">
				{name}
			</div>
			<div id="account-pic">
				<div id="pic-container">
					<img id="profile" src=""></img>
				</div>
			</div>
			<div id="account-date">{"Joined XX-XX-XX"}</div>
			{name != user.user ? <FriendStatus name={name} friend={user}/> : ''}
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