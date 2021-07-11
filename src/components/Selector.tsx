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
	return (<div id="self-sidebar"><div id="homepage" title={'Home'} onClick={() => updateSelf(true)}>
		<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-user" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
  			<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  			<circle cx="12" cy="7" r="4" />
  			<path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
		</svg>
	</div>
	<div id="settings" title={'Settings'} onClick={() => updateSelf(false)}>
		<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-settings" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
  			<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  			<path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
  			<circle cx="12" cy="12" r="3" />
		</svg>
	</div>
	<div id="logout" title={'Log Out'} onClick={logUserOut}>
		<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-logout" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
  			<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  			<path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
  			<path d="M7 12h14l-3 -3m0 6l3 -3" />
		</svg>
	</div>
	</div>);
}