import * as React from 'react';
import './sass/PromptBox.scss';

export const PromptBox = ({showing, updatePrompt, loadChannels}) => {
	const [channelName, updateChannelName] = React.useState('');
	const [privacy, updatePrivacy] = React.useState('Private');
	const [credentials, updateCredentials] = React.useState('');
	const addChannel = async () => {
		if (!channelName.match(/^@[a-z0-9]{5,32}$/)) return;
		const resp = await fetch("/addchannel", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"channelName": channelName, "access": privacy, "credentials": credentials})});
		const r = await resp.json();
		console.log(r["status"]);
		if (r["status"] === "success") {
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
	const up = event => {
		console.log(event.target.value);
		updateChannelName(event.target.value);
	}
	const upPriv = event => {
		console.log(event.target.value);
		updatePrivacy(event.target.value);
	}
	const upCred = event => {
		console.log(event.target.value);
		updateCredentials(event.target.value);
	}
	return (<div className={`prompt ${showing}`}>
		<div id="exit" onClick={() => updatePrompt('')}>{"\u2715"}</div>
		<div className={`prompt-box ${showing}`}>
			<div id="form">
				<label htmlFor="channelname">{"Channel Name"}</label>
				<input name="channelname" onChange={up} value={channelName}/>
				<label htmlFor="authreq">{"Auth Requirements"}</label>
				<select name="authreq" onChange={upPriv} value={privacy}>
					<option>{"Private"}</option>
					<option>{"Public"}</option>
				</select>
				{(privacy === 'Private') ?
					<><label htmlFor="credentials">{"Access code"}</label>
					<input name="credentials" onChange={upCred} value={credentials}/></> : ''
				}
				<button onClick={addChannel}>{"Create Channel"}</button>
			</div>
		</div>
	</div>);
}