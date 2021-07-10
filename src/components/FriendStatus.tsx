import * as React from 'react';
import { UserInfo } from '../UserInfo';
import './sass/FriendStatus.scss';

export const FriendStatus = ({name, userFriends, updateUserFriends}) => {
	const [status, updateStatus] = React.useState('Befriend');
	const { user, friends, updateFriends, pending } = React.useContext(UserInfo);
	React.useEffect(() => {
		console.log('\n\nrerendering');
		console.log(friends);
		friends && friends.length && friends.map(elem => {
			if (name == elem['friend']) updateStatus('Friended \u2713');
		});
		pending && pending.length && pending.map(elem => {
			if (name == elem['friend']) updateStatus('Pending');
		});
	}, [name, friends]);
	const changeFriendStatus = async () => {
		if (status == 'Befriend') {
			// add friend
			const resp = await fetch(`/addfriend?friend=${name}`, {method: 'GET'});
			const r = await resp.json();
			r['friendstatus'] == 'Friended' ? updateStatus('Friended \u2713') : updateStatus('Pending');
			console.log('Changing friends');
			console.log(r);
			// update friend list
			if (r['friendstatus'] == 'Friended') {
				// update loggedIn user's friends
				updateFriends([...friends, {"friend": name}]);
				// update new friend's friend list
				updateUserFriends([...userFriends, {"friend": user}]);
				
			}
			// FIXME if the friendstatus is now `Friended`, add the friend to the friendsList
		} else if (status == 'Friended \u2713') {
			// remove friend
		} else if (status == 'Pending') return;
	}
	return (<div id="befriend">
		<button id="befriend-button" onClick={changeFriendStatus}>
			{status}
		</button>
	</div>);
}