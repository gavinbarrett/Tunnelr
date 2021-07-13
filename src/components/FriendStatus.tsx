import * as React from 'react';
import { UserInfo } from '../UserInfo';
import './sass/FriendStatus.scss';

export const FriendStatus = ({name, userFriends, updateUserFriends}) => {
	const [status, updateStatus] = React.useState<string>('Befriend');
	const { user, friends, updateFriends, pending } = React.useContext(UserInfo);
	React.useEffect(() => {
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
			const payload = await resp.json();
			// update friend list
			if (payload['friendstatus'] == 'Friended') {
				updateStatus('Friended \u2713')
				// update loggedIn user's friends
				updateFriends([...friends, {"friend": name}]);
				// update new friend's friend list
				updateUserFriends([...userFriends, {"friend": user}]);
	
			} else {
				updateStatus('Pending');
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