import * as React from 'react';
import './sass/Chat.scss';

const PromptBox = ({showing, updatePrompt}) => {
	return (<div className={`prompt ${showing}`}>
		<div id="exit" onClick={() => updatePrompt('')}>{"\u2715"}</div>
		<div className={`prompt-box ${showing}`}>
			<form>
				<label for="channelname">{"Channel Name"}</label>
				<input name="channelname"/>
				<label for="authreq">{"Auth Requirements"}</label>
				<select name="authreq">
					<option>{"Private"}</option>
					<option>{"Public"}</option>
				</select>
			</form>
		</div>
	</div>);
}

const Channel = ({id}) => {
	const [message, updateMessage] = React.useState('');
	const [wsocket, updateWSocket] = React.useState(new WebSocket(`ws://127.0.0.1:8080/chat?roomID=${id}`));
	React.useEffect(() => {
		
		wsocket.onopen = () => {
			console.log('Connected to server.');
			wsocket.send("Hey server, how's your day?");
		}
		wsocket.onmessage = ({data}) => {
			console.log(`Server sent:> ${data}`);
		}
	}, []);
	const sendMessage = () => {
		if (message === '') return;
		console.log(message);
		wsocket.send(message);
	}
	return (<div className="channel">
		<input placeholder={"Input your chat here"} onChange={e => updateMessage(e.target.value)}/>
		<button onClick={sendMessage}>{"Send"}</button>
	</div>);
}

const SideBar = ({expanded, updateExpanded, prmpt, updatePrompt, updatePage}) => {
	const alter = () => {
		// toggle expanding sidebar on and off
		expanded.length ? updateExpanded('') : updateExpanded('expanded');
	}
	const upPrompt = () => {
		// toggle 
		if (expanded.length)
			prmpt.length ? updatePrompt('') : updatePrompt('showing');
	}
	const upPage = () => {
		if (expanded.length)
			updatePage(<Channel id={"crashbanditooth"}/>);
	}
	const upHome = () => {
		if (expanded.length)
			updatePage(<ChatMenu/>);
	}
	return (<div className={`channel-bar ${expanded}`}>
		<div id="box" onClick={alter}>{">"}</div>
		<div className={`add-channel${expanded}`} onClick={upHome}>{"Chat Menu"}</div>
		<div className={`add-channel${expanded}`} onClick={upPrompt}>{"+ Add Channel"}</div>
		<div className={`add-channel${expanded}`} onClick={upPage}>{"Test Channel"}</div>
	</div>);
}


const ChatMenu = () => {
	const queryFriend = async event => {
		// FIXME: validate input
		// FIXME: if valid, send to server to query db
		console.log(event.target.value);
		if (matchReg(event.target.value, /^#[a-z0-9]+$/i)) {
			const resp = await fetch("/queryfriend", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"friendid": event.target.value})});
			const r = await resp.json();
			console.log(r);
		}
	}
	const queryChannel = async event => {
		// FIXME: validate input
		// FIXME: if valid, send to server to query db
		console.log(event.target.value);
		if (matchReg(event.target.value, /^@[a-z0-9]+$/i)) {
			const resp = await fetch("/querychannel", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"channelid": event.target.value})});
			const r = await resp.json();
			console.log(r);
		}
	}
	const matchReg = (text, regex) => {
		return text.match(regex);
	}
	return(<div id="chat-menu">
		<div id="friend-search-box">
			<p className="search-title">{"search for friends"}</p>
			<div className="search-box-wrapper">
				<input className="search-box" id="friend-search" onChange={queryFriend}/>
			</div>
		</div>
		<div id="channel-search-box">
			<p className="search-title">{"search for channels"}</p>
			<div className="search-box-wrapper">
				<input className="search-box" id="channel-search" onChange={queryChannel}/>
			</div>
		</div>
	</div>);
}

export const Chat = () => {
	const [message, updateMessage] = React.useState('');
	const [expanded, updateExpanded] = React.useState('');
	const [prmpt, updatePrompt] = React.useState('');
	const [page, updatePage] = React.useState(<ChatMenu/>);
	return (<div id="chat-wrapper">
		<SideBar expanded={expanded} updateExpanded={updateExpanded} prmpt={prmpt} updatePrompt={updatePrompt} updatePage={updatePage}/>
			{page}
		<PromptBox showing={prmpt} updatePrompt={updatePrompt}/>
	</div>);
}
