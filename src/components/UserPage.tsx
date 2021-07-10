import * as React from 'react';
import { FriendStatus } from './FriendStatus';
import { FriendsList } from './FriendsList';
import './sass/HomePage.scss';

export const UserPage = ({name, updateName, userJoined, userFriends, updateUserFriends, userPending, updateUserPending, userProfile}) => {
    return (<div id="account-wrapper">
        <div id="account-home">
            <div id="account-name">
                <p id="account-name-text" title={name}>{name}</p>
            </div>
            <div id="account-pic">
                <div id="pic-container">
                    <img id="profile" src={userProfile} accept={'image/*'}/>
                </div>
            </div>
            <div id="account-date">{`Joined: ${userJoined}`}</div>
            <FriendStatus name={name} userFriends={userFriends} updateUserFriends={updateUserFriends}/>
        </div>
        <div id="account-friends">
            <FriendsList updateName={updateName} friends={userFriends}/>
        </div>
    </div>);
}