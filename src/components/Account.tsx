import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { HomePage } from './HomePage';
import { UserPage } from './UserPage';
import { Selector } from './Selector';
import { Settings } from './Settings';
import { UserInfo } from '../UserInfo';
import './sass/Account.scss';

export const Account = () => {
	const { user, loc } = React.useContext(UserInfo);
	const [self, updateSelf] = React.useState<boolean>(true);
	const [name, updateName] = React.useState<string>(null);
	const [userJoined, updateUserJoined] = React.useState<Array<Object>>([]);
	const [userProfile, updateUserProfile] = React.useState<Array<Object>>([]);
	const [userFriends, updateUserFriends] = React.useState<Array<Object>>([]);
	const [userPending, updateUserPending] = React.useState<Array<Object>>([]);

	const history = useHistory();
	React.useEffect(() => {
		loadAccount();
	}, [loc]);
	const loadAccount = async () => {
		const username: string = loc.pathname.split('/')[2];
		// FIXME: download user's account data
		//console.log(`Username: ${username}`);
		// if the user is looking at their own account, we should have already pulled data from the store and loaded it into the user, profile, joined, etc variables
		//console.log(`Username: ${username}\nUser: ${user}`);
		if (username == user) {
			updateName(username);
			console.log('Already have data')
		} else if (username) {
			console.log('grabbing data');
			updateName(username);
			grabUserInfo(username);
		} else
			history.push('/notfound');
	}
	const grabUserInfo = async name => {
		console.log(`Grabbing ${name}`);
		const resp = await fetch(`/loaduserinfo/?name=${name}`, {method: 'GET'});
		if (resp.status == 200) {
			const payload = await resp.json();
			const created_date = payload["created_at"].split(' ');
			if (created_date == "null") history.push(`/notfound`);
			const date = created_date.splice(1, 3).join(' ');
			// set joined date
			updateUserJoined(date);
			const profilepic = payload['profile'];
			console.log(`Profilepic: ${profilepic}`);
			// set profile picture
			(profilepic == null) ? updateUserProfile('images/blank.png') : updateUserProfile(`data:image/png;base64,${profilepic}`);
			updateUserFriends(payload['friends']);
		} else
			history.push('/notfound');
	}
	return (<div id="account-page">
		{name === user ? <>
			<div id="side">
				<Selector updateSelf={updateSelf}/>
			</div>
			{self ? <HomePage name={name} updateName={updateName}/> : <Settings/>}
		</> : <>
			<div id="side">
			</div>
			<UserPage name={name} updateName={updateName} userJoined={userJoined} userFriends={userFriends} updateUserFriends={updateUserFriends} userPending={userPending} updateUserPending={updateUserPending} userProfile={userProfile}/>
		</>}
	</div>);
}