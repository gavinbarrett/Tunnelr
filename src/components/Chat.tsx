import * as React from 'react';
import './sass/Chat.scss';

export const Chat = () => {
	const [message, updateMessage] = React.useState('');
	const sendMessage = () => {
		if (message === '') return;
		console.log(message);
	}
	return (<div id="chat-wrapper">
		<input placeholder={"Input your chat here"} onChange={e => updateMessage(e.target.value)}/>
		<input type="submit" onClick={sendMessage}/>
	</div>);
}
