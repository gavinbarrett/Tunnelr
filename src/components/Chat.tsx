import * as React from 'react';
import './sass/Chat.scss';

const PromptBox = ({showing, updatePrompt}) => {
	const [channelName, updateChannelName] = React.useState('');
	const [privacy, updatePrivacy] = React.useState('Private');
	const [credentials, updateCredentials] = React.useState('');
	const addChannel = async () => {
		//if (!channelName.match(/^@[a-z0-9]{5,32}$/)) return;
		const resp = await fetch("/addchannel", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"channelName": channelName, "access": privacy, "credentials": credentials})});
		const r = await resp.json();
		console.log(r["status"]);
		if (r["status"] === "success")
			updatePrompt('');
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
				<label for="channelname">{"Channel Name"}</label>
				<input name="channelname" onChange={up}/>
				<label for="authreq">{"Auth Requirements"}</label>
				<select name="authreq" onChange={upPriv}>
					<option>{"Private"}</option>
					<option>{"Public"}</option>
				</select>
				{(privacy === 'Private') ?
					<><label for="credentials">{"Access code"}</label>
					<input name="credentials" onChange={upCred}/></> : ''
				}
				<button onClick={addChannel}>{"Create Channel"}</button>
			</div>
		</div>
	</div>);
}

const Channel = ({sender, id}) => {
	const [message, updateMessage] = React.useState('');
	const [wsocket, updateWSocket] = React.useState(new WebSocket(`ws://192.168.1.62:8080/?roomID=${id}`));
	const [channelMessages, updateChannelMessages] = React.useState([]);
	const [lastMessage, updateLastMessage] = React.useState('0');
	React.useEffect(() => {
		getChannelMessages();
	}, []);
	const getChannelMessages = async () => {
		console.log("grabbing messages");
		const resp = await fetch(`/getmessages/?roomID=${id}`, {method: "GET"});
		const r = await resp.json();
		console.log(r["status"]);
		if (r["status"] === "failed") return;
		else {
			const allmessages = r["status"][1];
			const last = allmessages[allmessages.length - 1];
			// store most recent message id
			updateLastMessage(last[0]);
			// update displayed messages
			updateChannelMessages(allmessages.reverse());
		}
	}
	const sendMessage = async () => {
		console.log('Firing sendmessage');
		if (message === '') return;
		// send message to the websocket server
		wsocket.send(JSON.stringify({"sender": sender, "message": message}));
		// clear the chat box
		updateMessage('');
		// FIXME: keep track of last message id and use it to pull all new messages
		const resp = await fetch(`/getupdatedmessages/?roomID=${id}&lastmessage=${lastMessage}`, {method: "GET"});
		const r = await resp.json();
		console.log(r["status"]);
		// messages are up to date
		if (r["status"] === "failed") return;
		else {
			console.log("Updating message");
			// new messages received from the server
			const latest = r["status"][0][1];
			console.log(`Latest: ${latest}`);
			updateChannelMessages(channelMessages => [...latest.reverse(), ...channelMessages]);
			updateLastMessage(latest[0][0]);
			console.log(lastMessage);
			console.log(channelMessages);
			console.log(`Channel messages: ${channelMessages}`);
			console.log(r);
		}
	}
	const changeMessage = event => {
		updateMessage(event.target.value);
	}
	return (<div className="channel">
		<div id="message-box">
			{channelMessages.length ? channelMessages.map(elem => {
				return <div className="message-snippet">{elem[1][1]}</div>
			}) : 'No messages found.'}
			<div id="anchor"></div>
		</div>
		<div id="inputbox">
			<textarea placeholder={"Input your chat here"} onChange={changeMessage} value={message}/>
			<button id="sendmessage" onClick={sendMessage}>{"Send"}</button>
		</div>
	</div>);
}

const SideBar = ({expanded, updateExpanded, prmpt, updatePrompt, updatePage, userChannels, user}) => {
	const alter = () => {
		// toggle expanding sidebar on and off
		expanded.length ? updateExpanded('') : updateExpanded('expanded');
	}
	const upPrompt = () => {
		// toggle 
		if (expanded.length)
			prmpt.length ? updatePrompt('') : updatePrompt('showing');
	}
	const upPage = value => () => {
		if (expanded.length)
			updatePage(<Channel sender={user} id={value}/>);
	}
	const upHome = () => {
		if (expanded.length)
			updatePage(<ChatMenu/>);
	}
	return (<div className={`channel-bar ${expanded}`}>
		<div id="box" onClick={alter}>{">"}</div>
		<div className={`add-channel${expanded} chatmenu`} onClick={upHome}>{"Chat Menu"}</div>
		<div className={`add-channel${expanded} addchannel`} onClick={upPrompt}>{"+ Add Channel"}</div>
		{userChannels.length ? userChannels.map((elem, idx) => {
			return <div key={idx} className={`add-channel${expanded}`} onClick={upPage(elem.channelname)}>{elem.channelname}</div>
		}) : ''}
	</div>);
}

const ChatMenu = () => {
	const [friendSearchList, updateFriendSearchList] = React.useState([]);
	const [channelSearchList, updateChannelSearchList] = React.useState([]);
	const queryFriend = async event => {
		// FIXME: validate input
		// FIXME: if valid, send to server to query db
		console.log(event.target.value);
		if (event.target.value.match(/^#[a-z0-9]+$/i)) {
			const resp = await fetch("/queryfriend", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"username": event.target.value})});
			const r = await resp.json();
			console.log(r);
			if (r["status"] === "failed") return;
			else updateFriendSearchList(r["status"]);
		}
	}
	const queryChannel = async event => {
		// FIXME: validate input
		// FIXME: if valid, send to server to query db
		console.log(event.target.value);
		if (event.target.value.match(/^@[a-z0-9]+$/i)) {
			const resp = await fetch("/querychannel", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"channelid": event.target.value})});
			const r = await resp.json();
			console.log(r);
			if (r["status"] === "failed") return;
			else updateChannelSearchList(r["status"]);
		}
	}
	return(<div id="chat-menu">
		<div id="friend-search-box">
			<p className="search-title">{"search for friends"}</p>
			<div className="search-box-wrapper">
				<input list="friend-search-list" className="search-box" id="friend-search" onChange={queryFriend}/>
				<datalist id="friend-search-list">
					{friendSearchList.length ? friendSearchList.map(elem => {
						return <option value={elem.username}/>;
					}) : ''}
				</datalist>
			</div>
		</div>
		<div id="channel-search-box">
			<p className="search-title">{"search for channels"}</p>
			<div className="search-box-wrapper">
				<input list="channel-search-list" className="search-box" id="channel-search" onChange={queryChannel}/>
				<datalist id="channel-search-list">
					{channelSearchList.length ? channelSearchList.map(elem => {
						return <option value={elem.channelname}/>;
					}) : ''}
				</datalist>
			</div>
		</div>
	</div>);
}

export const Chat = ({user}) => {
	const [message, updateMessage] = React.useState('');
	const [expanded, updateExpanded] = React.useState('');
	const [prmpt, updatePrompt] = React.useState('');
	const [userChannels, updateUserChannels] = React.useState([]);
	const [page, updatePage] = React.useState(<ChatMenu/>);
	React.useEffect(() => {
		loadUserChannels();
	}, []);
	const loadUserChannels = async () => {
		/* load the channels the user belongs to */
		const resp = await fetch("/loadchannels", {method: "GET"});
		const r = await resp.json();
		if (r["status"] !== "failed")
			updateUserChannels(r["status"]);
	}
	return (<div id="chat-wrapper">
		<SideBar expanded={expanded} updateExpanded={updateExpanded} prmpt={prmpt} updatePrompt={updatePrompt} updatePage={updatePage} userChannels={userChannels} user={user}/>
			{page}
		<PromptBox showing={prmpt} updatePrompt={updatePrompt}/>
	</div>);
}
