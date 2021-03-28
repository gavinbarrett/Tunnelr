import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Router from 'react-router-dom';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { SignUp } from './components/SignUp';
import { SignIn } from './components/SignIn';
import { Chat } from './components/Chat';
import './components/sass/App.scss';

const App = () => {
	const [loggedIn, updateLoggedIn] = React.useState(false);
	const hist = Router.useHistory();
	const ws = new WebSocket('ws://127.0.0.1:8080/chat?roomID=hellurr');
	React.useEffect(() => {
		// try to retrieve prior session
		getSession();
		ws.onopen = () => {
			console.log('Connected to server.');
			ws.send("Hey server, how's your day?");
		}
		ws.onmessage = ({data}) => {
			console.log(`Server sent:> ${data}`);
		}
	});
	const getSession = async () => {
		const resp = await fetch("/getsession", {method: "GET"});
		const r = resp.json();
		if (resp.status === 401) {
			// FIXME: couldn't reauth session, dont log user back in
			console.log("No session exists; please log in.");
		} else if (resp.status === 200) {
			// FIXME: log user into the ui
			console.log('Logging user back into their session');
			updateLoggedIn(true);
		} else {
			console.log(`${resp.status} received`);
		}
		console.log(r);
	}
	return (<div className="app-wrapper">
		<Header loggedIn={loggedIn}/>
		<Router.Switch>
			<Router.Route path="/" exact render={() => <LandingPage loggedIn={loggedIn}/>}/>
			<Router.Route path="/signup" render={() => <SignUp/>}/>
			<Router.Route path="/signin" render={() => <SignIn updateLoggedIn={updateLoggedIn}/>}/>
			<Router.Route path="/chat">
				{loggedIn ? <Chat/> : <Router.Redirect to="/signin"/>}
			</Router.Route>
		</Router.Switch>
	</div>);
}

ReactDOM.render(<Router.HashRouter><App/></Router.HashRouter>, document.getElementById('root'));
