import * as React from 'react';
import { FriendsList } from './FriendsList';
import { UserInfo } from '../UserInfo';
import './sass/HomePage.scss';

export const HomePage = ({name, updateName}) => {
    const { joined, profile, friends } = React.useContext(UserInfo);
	return (<div id="account-wrapper">
		<div id="account-home">
			<div id="account-name">
				<p id="account-name-text" title={name}>{name}</p>
			</div>
			<div id="account-pic">
				<div id="pic-container">
					<img id="profile" src={profile} accept={'image/*'} loading={'lazy'}/>
				</div>
			</div>
			<div id="account-date">{`Joined: ${joined}`}</div>
		</div>
		<div id="account-friends">
			<FriendsList updateName={updateName} friends={friends}/>
		</div>
	</div>);
}