import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { UserInfo } from '../UserInfo';
import './sass/Selector.scss';

export const Selector = ({updateSelf}) => {
	const { updateUser, updateLoggedIn } = React.useContext(UserInfo);
	const hist = useHistory();
	const logUserOut = async () => {
		const resp = await fetch('/logout', {method: "GET"});
		if (resp.status == 200) {
			// log user out of front end
			updateUser('');
			updateLoggedIn(false);
			document.cookie = "";
			// return to the landing page
			hist.push('/');
		}
	}
	return (<div id="self-sidebar"><div id="homepage" onClick={() => updateSelf(true)}>
		{"Home Page"}
	</div>
	<div id="settings" onClick={() => updateSelf(false)}>
		{"Settings"}
	</div>
	<div id="logout" onClick={logUserOut}>
		{"Log Out"}
	</div>
	</div>);
}