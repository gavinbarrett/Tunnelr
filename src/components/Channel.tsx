import * as React from 'react';
import './sass/Channel.scss';

export const Channel = ({sender, id, wsocket, minimized, updateMinimized}) => {
	const [message, updateMessage] = React.useState<string>('');
	const [lastMessage, updateLastMessage] = React.useState<string>('0');
	const [channelMessages, updateChannelMessages] = React.useState<Array<Object>>([]);
	React.useEffect(() => {
		console.log(`Sender: ${sender}`);
		establishWSocket();
	}, [id]);
	const establishWSocket = async () => {
		wsocket.current.onopen = () => {
			// FIXME: request data from channel
			console.log('Opening socket connection.');
		}
		wsocket.current.onmessage = message => {
			console.log(`Message received: ${message.data}`);
			let payload = JSON.parse(message.data);
			if (!payload) {
				updateLastMessage('0');
				updateChannelMessages([]);
				return;
			}
			let p = payload[0];
			// l[0][0] is the channel name; l[0][1] is the id and message payload
			// p[0] is name of channel
			// array of messages
			const cd = p[1];
			// last message
			let last = cd[cd.length - 1];

			console.log('Last message:');
			console.log(`ID: ${last[0]}`);
			if (last[0] != lastMessage) {
				updateLastMessage(last[0]);
				updateChannelMessages(channelMessages => [...cd.reverse(), ...channelMessages]);
			}
		}
		wsocket.current.onclose = () => console.log('Closing socket connection.');
	}
	const sendMessage = async () => {
		// send a message to the channel
		console.log('Firing sendmessage');
		if (message === '') return;
		console.log(`Message: ${message}`);
		// send message to the websocket server
		wsocket.current.send(JSON.stringify({"sender": sender, "message": message, "lastid": lastMessage}));
		// clear the chat box
		updateMessage('');
	}
	const changeMessage = event => {
		updateMessage(event.target.value.replace(/^\n|\n$/g, ''));
	}
	const checkForEnter = event => {
		// send the message upon keying the Enter button
		if (event.keyCode === 13) { 
			sendMessage();
			updateMessage('');
		}
	}
	return (<div className={`channel ${minimized}`}>
		<div id="message-box">
			{channelMessages.length ? channelMessages.map((elem, index) => {
				// interpret the UNIX timestamp in Pacific Time
				let time = new Date(parseInt(elem[0]));
				let data = JSON.parse(elem[1][1]);
				let cls = (data.sender == sender) ? 'sent-message' : 'received-message';
				return <div key={index} className={`${cls}`}><p className="message">{data.message}</p><p className="sender"><p>{time.toLocaleString()}</p><p title={data.sender} className="sender-name">{data.sender}</p></p></div>
			}) : <NoMessages/>}
			<div id="anchor"></div>
		</div>
		<div id="inputbox">
			<textarea placeholder={"Write your message here"} onKeyDown={checkForEnter} onChange={changeMessage} value={message}/>
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