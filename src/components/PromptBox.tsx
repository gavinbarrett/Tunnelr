import * as React from 'react';
import { ErrorMessage } from './ErrorMessage';
import { Messages } from '../Messages';
import './sass/PromptBox.scss';

export const PromptBox = ({showing, updatePrompt, loadChannels}) => {
	const [channelName, updateChannelName] = React.useState('');
	const [privacy, updatePrivacy] = React.useState('Private');
	const [mode, updateMode] = React.useState('Password');
	const [credentials, updateCredentials] = React.useState('');
	const [displayError, updateDisplayError] = React.useState(false);
	const { updateErrorMessage } = React.useContext(Messages);

	const addChannel = async () => {
		if (!channelName.match(/^@[a-z0-9]{5,32}$/)) {
			updateErrorMessage("Channel name isn't valid");
			updateDisplayError(true);
			return;
		}
		const resp = await fetch("/addchannel", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"channelName": channelName, "access": privacy, "credentials": credentials, "mode": mode})});
		console.log(resp);
		console.log(resp.status);
		if (resp.status == 200) {
			// load the new channel
			loadChannels();
			// hide the prompt box
			updatePrompt('');
			// reset channel variables
			updateChannelName('');
			updatePrivacy('Private');
			updateCredentials('');
		}
	}
	return (<div className={`prompt ${showing}`}>
		<div id="exit" onClick={() => updatePrompt('')}>{"\u2715"}</div>
		<div className={`prompt-box ${showing}`}>
			<div id="title-container">
				<ErrorMessage displayed={displayError} updateDisplayed={updateDisplayError}/>
			</div>
			<div id="form">
				<label htmlFor="channelname">{"Channel Name"}</label>
				<input name="channelname" onChange={event => updateChannelName(event.target.value)} value={channelName}/>
				<label htmlFor="authreq">{"Auth Requirements"}</label>
				<div id="authbox">
					<select name="authreq" onChange={event => updatePrivacy(event.target.value)} value={privacy}>
						<option>{"Private"}</option>
						<option>{"Public"}</option>
					</select>
					{(privacy === 'Public') ?
					'' :
					<select onChange={event => updateMode(event.target.value)} value={mode}>
						<option>{"Password"}</option>
						{/*<option>{"Access Control List"}</option>*/}
					</select>}
				</div>
				{(privacy === 'Private') ?
					<><label htmlFor="credentials">{"Access Code"}</label>
					<input name="credentials" onChange={event => updateCredentials(event.target.value)} value={credentials}/></> : ''
				}
				<button onClick={addChannel}>{"Create Channel"}</button>
			</div>
		</div>
	</div>);
}