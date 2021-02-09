import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './components/sass/App.scss';

const App = () => {
	
	const ws = new WebSocket('ws://127.0.0.1:8080');

	React.useEffect(() => {
		ws.onopen = () => {
			console.log('Connected to server.');
		}
	});

	return (<div className="app-wrapper">
		{"This is an application"}
	</div>);
}

ReactDOM.render(<App/>, document.getElementById('root'));
