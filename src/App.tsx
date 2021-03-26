import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Router from 'react-router-dom';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { Chat } from './components/Chat';
import { Footer } from './components/Footer';
import './components/sass/App.scss';

const App = () => {
	const ws = new WebSocket('ws://127.0.0.1:8080/chat?roomID=hellurr');
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
		<Router.Switch>
			<Router.Route path="/" exact render={() => <LandingPage/>}/>
			<Router.Route path="/chat" exact render={() => <Chat/>}/>
			<Router.Route path="/chat/*" exact render={() => <Chat/>}/>
		</Router.Switch>
		<Footer/>
	</div>);
}

ReactDOM.render(<Router.HashRouter><App/></Router.HashRouter>, document.getElementById('root'));
