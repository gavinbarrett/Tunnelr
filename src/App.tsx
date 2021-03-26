import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Header } from './components/Header';
import './components/sass/App.scss';

const App = () => {
	
	const ws = new WebSocket('ws://127.0.0.1:8080');

	React.useEffect(() => {
		ws.onopen = () => {
			console.log('Connected to server.');
			ws.send("Hey server, how's your day?");
		}

		ws.onmessage = ({data}) => {
			console.log(`Server sent:> ${data}`);
		}
	});

	return (<div className="app-wrapper">
		<Header/>
	</div>);
}

ReactDOM.render(<App/>, document.getElementById('root'));
