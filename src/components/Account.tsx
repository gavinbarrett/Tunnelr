import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import './sass/Account.scss';

export const Account = user => {
	const [name, updateName] = React.useState('');
	const loc = useLocation();

	React.useEffect(() => {
		const username = loc.pathname.split('/')[2];
		// FIXME: download user's account data
		console.log(`Username: ${username}\nUser: ${user.user}`);
		if (username) {
			updateName(username);
		} else
			return;
		if (username === user.user)
			console.log(`Usernames match.`);
		else
			console.log(`Usernames do not match.`);
	}, []);

	return (<><div id="account-page">
		<div id="side">
		</div>
		<div id="account-wrapper">
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
				{/*name != user ? <FriendStatus name={name} friend={user}/> : ''*/}
			</div>
			<div id="account-friends">
				<div id="friends-list">
					{"Friends"}
				</div>
			</div>
		</div>);
	</div>
	<Footer/></>);
}

const Selector = (page, updatePage, name, user) => {
	return (<><div id="homepage" onClick={() => updatePage(<HomePage name={name} user={user}/>)}>
		{"Home Page"}
	</div>
	<div id="settings" onClick={() => updatePage(<Settings name={name}/>)}>
		{"Settings"}
	</div>
	</>);
}

const HomePage = (name, user) => {
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
			{/*name != user ? <FriendStatus name={name} friend={user}/> : ''*/}
		</div>
		<div id="account-friends">
			<div id="friends-list">
				{"Friends"}
			</div>
		</div>
	</div>);
}

const Settings = name => {
	return (<div id="settings-page">
		{"settings"}
	</div>);
}

const FriendStatus = (name, friend) => {
	return (<div id="befriend">{"Add Friend"}</div>);
}