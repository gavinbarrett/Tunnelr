import * as React from 'react';
import { useHistory } from 'react-router-dom';
import './sass/FriendsList.scss';

export const FriendsList = ({updateName, friends}) => {
	const history = useHistory();
	const showUser = async user => {
		updateName(user);
		history.push(`/account/${user}`);
	}
	return (<div id="friends-list">
		<p id="friends-header">{"Friends"}</p>
		<div id="friend-wrapper">
			{friends && friends.length ? friends.map((elem, id) => {
				return <p className="friend-slide" key={id} title={elem.friend} onClick={() => showUser(elem.friend)}>
					<p className="friend-name" key={id}>{elem.friend}</p>
			</p>}) : <p id="no-friends">{""}</p>}
		</div>
	</div>);
}