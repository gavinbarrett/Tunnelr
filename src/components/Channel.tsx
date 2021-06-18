import * as React from 'react';
import './sass/Channel.scss';

export const Channel = ({sender, id, wsocket}) => {
	const [message, updateMessage] = React.useState('');
	const [channelMessages, updateChannelMessages] = React.useState([]);
	const [lastMessage, updateLastMessage] = React.useState('0');

	React.useEffect(() => {
		getChannelMessages();
	}, [id]);
	const getChannelMessages = async () => {
		console.log("grabbing messages");
		const resp = await fetch(`/getmessages/?roomID=${id}`, {method: "GET"});
		const r = await resp.json();
		console.log(r["status"]);
		if (r["status"] === "none") {
			updateLastMessage('0');
			updateChannelMessages([]);
		} else {
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
		wsocket.current.send(JSON.stringify({"sender": sender, "message": message}));
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
			{channelMessages.length ? channelMessages.map((elem, index) => {
				return <div key={index} className="message-snippet">{elem[1][1]}</div>
			}) : <NoMessages/>}
			<div id="anchor"></div>
		</div>
		<div id="inputbox">
			<textarea placeholder={"Write your message here"} onChange={changeMessage} value={message}/>
			<button id="sendmessage" onClick={sendMessage}>{"Send"}</button>
		</div>
	</div>);
}

const NoMessages = () => {
	return (<div id="no-messages">
		<p>{"No messages found."}</p>
		<p>{"Be the first one!"}</p>
	</div>);
}