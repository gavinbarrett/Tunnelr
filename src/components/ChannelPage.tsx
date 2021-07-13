import * as React from 'react';
import { Footer } from './Footer';
import { useLocation } from 'react-router-dom';
import { ErrorMessage } from './ErrorMessage';
import { UserInfo } from '../UserInfo';
import { Messages } from '../Messages';
import './sass/ChannelPage.scss';

export const ChannelPage = () => {
    const { user, loggedIn } = React.useState(UserInfo);
    const [name, updateName] = React.useState<string>('');
    const [access, updateAccess] = React.useState<string>('');
    const [mode, updateMode] = React.useState<string>('');
    const [doc, updateDoc] = React.useState<string>('');
    const [memberStat, updateMemberStat] = React.useState<string>('NOT');
    const [created, updateCreated] = React.useState<string>('');
    const [userCount, updateUserCount] = React.useState<number>(0);
    const [displayLeave, updateDisplayLeave] = React.useState<boolean>(false);
    const [displayPassword, updateDisplayPassword] = React.useState<boolean>(false);
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
        if (resp.status != 200) return;
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
    }
    return (<><div id="channel-page">
            <div id="channel-header">{name}</div>
            <div id="channel-access">{`Access: ${access}`}{access == 'Private' ? '/' : ''}{mode}</div>
            <div id="doc">{`Created on ${doc}`}</div>
            <JoinButton name={name} access={access} mode={mode} memberStat={memberStat} updateMemberStat={updateMemberStat} updateDisplayLeave={updateDisplayLeave} updateDisplayPassword={updateDisplayPassword} joinButton={joinButton} updateJoinButton={updateJoinButton}/>
            <LeavePrompt name={name} displayLeave={displayLeave} updateDisplayLeave={updateDisplayLeave} updateJoinButton={updateJoinButton} updateMemberStat={updateMemberStat}/>
            <PasswordPrompt name={name} displayPassword={displayPassword} updateDisplayPassword={updateDisplayPassword} updateMemberStat={updateMemberStat}/>
        </div>
    <Footer/>
    </>);
}

const LeavePrompt = ({name, displayLeave, updateDisplayLeave, updateJoinButton, updateMemberStat}) => {
    const [channelName, updateChannelName] = React.useState('');
    const [checked, updateChecked] = React.useState('');
    const [displayError, updateDisplayError] = React.useState(false);
    const { updateErrorMessage } = React.useContext(Messages);
    const leaveChannel = async () => {
        // leave a channel
        if (channelName != name) {
            console.log('Channels do not match');
            updateErrorMessage('Channels do not match');
            updateDisplayError(true);
        } else if (checked != 'checked') {
            console.log('Please check the box');
            updateErrorMessage('Please check the box');
            updateDisplayError(true);
        } else {
            const resp = await fetch(`/leavechannel?channel=${name}`, {method: 'GET'});
            if (resp.status == 200) {
                updateDisplayLeave(false);
                updateDisplayError(false);
                updateErrorMessage('');
                updateChannelName('');
                updateChecked('');
                updateMemberStat('NOT');
                updateJoinButton(<Join name={name} updateMemberStat={updateMemberStat}/>);
            } else {
                updateErrorMessage('Failed to leave channel');
                updateDisplayError(true);
            }
        }
    }
    return (<div className={`leave-prompt ${displayLeave}`}>
        <div id="exit-leave-prompt">
            <ErrorMessage displayed={displayError} updateDisplayed={updateDisplayError}/>
            <p id="exit" onClick={() => {
                updateDisplayLeave(false);
                updateDisplayError(false);
                updateErrorMessage('');
                updateChecked('');
                updateChannelName('');
            }}>{'\u2715'}</p>
        </div>
        <div id="leave-q">{`Are you sure you want to leave ${name}?`}</div>
        <div id="leave-checkbox">
            <p id="checkbox-text">{"Check the box"}</p>
            <input id="checkbox" type="checkbox" checked={checked} onChange={() => {
                (checked == 'checked') ? updateChecked('') : updateChecked('checked');
            }}/>
        </div>
        <div id="enter-check">{`Enter the channel name exactly: ${name}`}</div>
        <input id="channel-check-input" value={channelName} type="text" onChange={event => updateChannelName(event.target.value)}/>
        <button id="leave-channel" onClick={leaveChannel}>{"Leave Channel"}</button>
    </div>);
}

const PasswordPrompt = ({name, displayPassword, updateDisplayPassword, updateMemberStat}) => {
    const [password, updatePassword] = React.useState('');
    const [displayError, updateDisplayError] = React.useState(false);
    const { updateErrorMessage } = React.useContext(Messages);
    const joinPSKChannel = async () => {
        if (!password.match(/[a-z0-9]{4,64}/i)) {
            updateErrorMessage('Password is not valid');
            updateDisplayError(true);
        }
        // FIXME: regex match to input validate the password
        const resp = await fetch('/joinpskchannel', {method: 'POST', headers: {"Content-Type": "application/json"}, body: JSON.stringify({"password": password, "channelname": name})});
        updatePassword('');
        if (resp.status == 200) {
            updateDisplayPassword('');
            updateMemberStat('MEMBER');
        }
    }
    return (<div className={`channel-password-prompt ${displayPassword}`}>
        <div id="password-prompt-exit">
            <ErrorMessage displayed={displayError} updateDisplayed={updateDisplayError}/>
            <div id="exit" onClick={() => {
                updatePassword('');
                updateDisplayPassword('');
            }}>{"\u2715"}</div>
        </div>
        <div id="password-prompt-header">{`Please enter the password for ${name}`}</div>
        <input id="password-input" value={password} type="text" onChange={event => updatePassword(event.target.value)}/>
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
        } else if (memberStat == 'PENDING')
            updateJoinButton(<Pending/>);
        else if (memberStat == 'MEMBER')
            updateJoinButton(<Joined updateDisplayLeave={updateDisplayLeave}/>);
    }, [access, mode, memberStat]);
    return (<div id="join">
        {joinButton}
    </div>);
}

const Join = ({name, updateMemberStat}) => {
    const joinChannel = async () => {
        // subscribe a user to the currrent channel
        const resp = await fetch(`/joinchannel?channel=${name}`, {method: 'GET'});
        if (resp.status == 200) updateMemberStat('MEMBER');
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
    return (<div id="enter-password-button" onClick={() => updateDisplayPassword('channel-password-prompt-displayed')}>
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