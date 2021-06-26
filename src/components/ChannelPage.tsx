import * as React from 'react';
import { Footer } from './Footer';
import { useLocation } from 'react-router-dom';
import { UserAuth } from '../UserAuth';
import './sass/ChannelPage.scss';

export const ChannelPage = () => {
    const { user, loggedIn } = React.useState(UserAuth);
    const [name, updateName] = React.useState('');
    const [access, updateAccess] = React.useState('');
    const [mode, updateMode] = React.useState('');
    const [doc, updateDoc] = React.useState('');
    const [memberStat, updateMemberStat] = React.useState('NOT');
    const [created, updateCreated] = React.useState('');
    const [userCount, updateUserCount] = React.useState(null);
    const [displayLeave, updateDisplayLeave] = React.useState('');
    const [displayPassword, updateDisplayPassword] = React.useState('');
    const [joinButton, updateJoinButton] = React.useState(<Join name={name} updateMemberStat={updateMemberStat}/>);

    const loc = useLocation();
    React.useEffect(() => {
        console.log('Loaded channel page.');
        const channelName = loc.pathname.split('/')[2];
        console.log(`Loading channel ${channelName}`);
        // load channel details
        getChannelInfo(channelName);
    }, []);
    const getChannelInfo = async channelName => {
        console.log('Getting info.');
        const resp = await fetch(`/loadchannelinfo/?channelname=${channelName}`, {method: 'GET'});
        const r = await resp.json();
        // format channel creation date
        let created_date = r["created_at"].split(" ");
        let date = created_date.splice(1, 4);
        updateDoc(date.join(' '));
        // update name and access controls
        updateName(r["name"]);
        updateAccess(r["access"]);
        updateMode(r["mode"]);
        updateMemberStat(r["memberstat"]);
        console.log(r);
    }
    return (<><div id="channel-page">
            <div id="channel-header">{name}</div>
            <div id="channel-access">{`Access Control: ${access}`}{"/"}{mode}</div>
            <div id="doc">{`Created on ${doc}`}</div>
            <JoinButton name={name} access={access} mode={mode} memberStat={memberStat} updateMemberStat={updateMemberStat} updateDisplayLeave={updateDisplayLeave} updateDisplayPassword={updateDisplayPassword} joinButton={joinButton} updateJoinButton={updateJoinButton}/>
            <LeavePrompt name={name} displayLeave={displayLeave} updateDisplayLeave={updateDisplayLeave} updateJoinButton={updateJoinButton} updateMemberStat={updateMemberStat}/>
            <PasswordPrompt name={name} displayPassword={displayPassword} updateDisplayPassword={updateDisplayPassword}/>
        </div>
    <Footer/>
    </>);
}

const LeavePrompt = ({name, displayLeave, updateDisplayLeave, updateJoinButton, updateMemberStat}) => {
    const [leaving, updateLeaving] = React.useState(false);
    const [channelName, updateChannelName] = React.useState('');
    const [leaveError, updateLeaveError] = React.useState('');
    const leaveChannel = async () => {
        // leave a channel
        if (channelName != name) {
            console.log('Channels do not match');
            updateLeaveError('Channels do not match');
            //setTimeout(updateLeaveError(''), 2000);
            return;
        } else if (!leaving) {
            console.log('Please check the box');
            updateLeaveError('Please check the box');
            //setTimeout(updateLeaveError(''), 2000);
            return;
        }
        console.log(`Submitting leave request.`);
        const resp = await fetch(`/leavechannel?channel=${name}`, {method: 'GET'});
        const r = await resp.json();
        console.log(r);
        if (r["status"] == "success") {
            updateDisplayLeave('');
            updateChannelName('');
            updateJoinButton(<Join name={name} updateMemberStat={updateMemberStat}/>);
            // FIXME: turn off prompt, update button to say Join again
        } else {
            updateLeaveError('Failed to leave channel');
            //setTimeout(updateLeaveError(''), 2000);
        }
    }
    return (<div className={`leave-prompt ${displayLeave}`}>
        <div id="exit-leave-prompt">
            {leaveError ? <p id={`leave-channel-error`}>{leaveError}</p> : ''}
            <p id="exit-leave" onClick={() => {
                updateDisplayLeave('');
                updateLeaveError('');
                updateLeaving(false);
            }}>{'\u2715'}</p>
        </div>
        <div id="leave-q">{`Are you sure you want to leave ${name}?`}</div>
        <div id="leave-checkbox">
            <p id="checkbox-text">{"Check the box"}</p>
            <input id="checkbox" type="checkbox" onChange={() => updateLeaving(!leaving)}/>
        </div>
        <div id="enter-check">{`Enter the channel name exactly: ${name}`}</div>
        <input id="channel-check-input" type="text" onChange={event => updateChannelName(event.target.value)}/>
        <button id="leave-channel" onClick={leaveChannel}>{"Leave Channel"}</button>
    </div>);
}

const PasswordPrompt = ({name, displayPassword, updateDisplayPassword}) => {
    const [password, updatePassword] = React.useState('');
    const [error, updateError] = React.useState('');
    const joinPSKChannel = async () => {
        if (!password.match(/[a-z0-9]{64}/i)) {
            console.log('Password does not match regex.');
            updateError('Password does not match regex');
        }
        // FIXME: regex match to input validate the password
        const resp = await fetch('/joinpskchannel', {method: 'POST', headers: {"Content-Type": "application/json"}, body: JSON.stringify({"password": password})});
        const r = await resp.json();
        console.log(r);
        updatePassword('');
    }
    return (<div className={`password-prompt ${displayPassword}`}>
        <div id="password-prompt-exit">
            {error ? <div id="psk-error">{error}</div> : ''}
            <div id="exit-password">{"\u2715"}</div>
        </div>
        <div id="password-prompt-header">{`Please enter the password for ${name}`}</div>
        <input id="password-input" type="text" onChange={event => updatePassword(event.target.value)}/>
        <button id="add-psk-channel" onClick={joinPSKChannel}>{"Join Channel"}</button>
    </div>);
}

// need to know if current user is a member of the channel
const JoinButton = ({name, access, mode, memberStat, updateMemberStat, updateDisplayLeave, updateDisplayPassword, joinButton, updateJoinButton}) => {
    /*
        if memberStat is NOT, then we display a Join/Request Access button that, will change when clicked
        
            if the access controls are public or private/ACL, change button to pending and wait for server response
                -> input pending in db
            if access controls are private/PSK, ask user for password, change button to pending, and send to server
                -> input pending in db

        if memberStat is PENDING, then we display pending button and don't allow any action
            -> maybe in the future allow them to rescind their request
   
        if memberStat is MEMBER, display the Joined button. If hovered over, it will turn to a Leave button, to remove the user from the channel
    */
    React.useEffect(() => {
        if (memberStat == 'NOT') {
            if (access == 'Private') {
                if (mode == 'PSK') updateJoinButton(<EnterPassword updateDisplayPassword={updateDisplayPassword}/>);
                else updateJoinButton(<RequestAccess/>);
            } else {
                updateJoinButton(<Join name={name} updateMemberStat={updateMemberStat}/>);
            }
        } else if (memberStat == 'PENDING') {
            updateJoinButton(<Pending/>);
        } else if (memberStat == 'MEMBER') {
            updateJoinButton(<Joined updateDisplayLeave={updateDisplayLeave}/>);
        }
    }, [access, mode, memberStat]);
    return (<div id="join">
        {joinButton}
    </div>);
}

const Join = ({name, updateMemberStat}) => {
    const joinChannel = async () => {
        // subscribe a user to the currrent channel
        const resp = await fetch(`/joinchannel?channel=${name}`, {method: 'GET'});
        const r = await resp.json();
        if (r["status"] == "success") {
            console.log('Updating member');
            updateMemberStat('MEMBER');
        }
    }
    return (<div id="join-button" onClick={joinChannel}>
        {"Join Channel"}
    </div>);
}

const RequestAccess = () => {
    return (<div id="request-access-button">
        {"Request Access"}
    </div>);
}

const EnterPassword = ({updateDisplayPassword}) => {
    return (<div id="enter-password-button" onClick={() => updateDisplayPassword('password-prompt-displayed')}>
        {"Enter Password"}
    </div>);
}

const Pending = () => {
    return (<div id="pending-button">
        {"Request Pending"}
    </div>);
}

const Joined = ({updateDisplayLeave}) => {
    const [leave, updateLeave] = React.useState('');
    const [text, updateText] = React.useState('Joined \u2713');
    // FIXME: if button is clicked when leave == 'leave', show prompt and confirm leaving the channel. send a request to the server
    const switchButtons = () => {
        if (leave == 'leave') {
            updateLeave('');
            updateText('Joined \u2713');
        } else {
            updateLeave('leave'); 
            updateText('Leave Channel');
        }
    }
    const leaveChannel = async () => {
        // FIXME: show user a confirmation prompt.
        // if they confirm, send a leave channel request to the server
        updateDisplayLeave('leave-prompt-displayed');
    }
    return (<div className={`joined-button ${leave}`} onMouseEnter={switchButtons} onMouseLeave={switchButtons} onClick={leaveChannel}>
        {text}
    </div>);
}