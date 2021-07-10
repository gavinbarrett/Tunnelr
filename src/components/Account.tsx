import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { HomePage } from './HomePage';
import { UserPage } from './UserPage';
import { Selector } from './Selector';
import { AccountController } from './AccountController';
import { UserInfo } from '../UserInfo';
import './sass/Account.scss';

export const Account = () => {
	const { user, updateUser, updateLoggedIn, profile, updateProfile, joined, updateJoined, friends, updateFriends, pending, updatePending, loc } = React.useContext(UserInfo);
	const [self, updateSelf] = React.useState(true);

	const [name, updateName] = React.useState(null);
	const [userJoined, updateUserJoined] = React.useState([]);
	const [userProfile, updateUserProfile] = React.useState([]);
	const [userFriends, updateUserFriends] = React.useState([]);
	const [userPending, updateUserPending] = React.useState([]);

	const history = useHistory();
	React.useEffect(() => {
		loadAccount();
	}, [loc]);
	const loadAccount = async () => {
		const username = loc.pathname.split('/')[2];
		// FIXME: download user's account data
		//console.log(`Username: ${username}`);
		// if the user is looking at their own account, we should have already pulled data from the store and loaded it into the user, profile, joined, etc variables
		//console.log(`Username: ${username}\nUser: ${user}`);
		if (username == user) {
			updateName(username);
			console.log('Already have data')
			return;
		} else if (username) {
			console.log('grabbing data');
			updateName(username);
			grabUserInfo(username);
		} else
			history.push('/notfound');
	}
	const grabUserInfo = async name => {
		//console.log(`Grabbing ${name}`);
		const resp = await fetch(`/loaduserinfo/?name=${name}`, {method: 'GET'});
		if (resp.status == 200) {
			const r = await resp.json();
			const created_date = r["created_at"].split(' ');
			if (created_date == "null") history.push(`/notfound`);
			const date = created_date.splice(1, 3).join(' ');
			// set joined date
			updateUserJoined(date);
			const profilepic = r['profile'];
			console.log(`Profilepic: ${profilepic}`);
			// set profile picture
			(profilepic == null) ? updateUserProfile('images/blank.png') : updateUserProfile(`data:image/png;base64,${profilepic}`);
			updateUserFriends(r['friends']);
		} else
			history.push('/notfound');
	}
	return (<div id="account-page">
		{name === user ? <>
			<div id="side">
				<Selector updateSelf={updateSelf}/>
			</div>
			{self ? <HomePage name={name} user={user} updateName={updateName}/> : <AccountController/>}
		</> : <>
			<div id="side">
			</div>
			<UserPage name={name} updateName={updateName} userJoined={userJoined} userFriends={userFriends} updateUserFriends={updateUserFriends} userPending={userPending} updateUserPending={updateUserPending} userProfile={userProfile}/>
		</>}
	</div>);
}

/*
return (<div id="account-page">
<div id="side">
	{name === user ? <Selector updateSelf={updateSelf}/> : ''}
</div>
{self ? (name === user ? <HomePage name={name} user={user} updateName={updateName}/> : <UserPage profile={} joined={}/>) : <AccountController/>}
</div>);
*/