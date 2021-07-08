import * as React from 'react';
import { Messages } from '../Messages';
import './sass/ErrorMessage.scss';

export const ErrorMessage = ({displayed, updateDisplayed}) => {
    const { errorMessage, updateErrorMessage } = React.useContext(Messages);
    React.useEffect(() => {
        console.log('Display change');
        checkRender();
    }, [displayed]);
    const checkRender = () => {
        if (displayed) {
            setTimeout(() => {
                updateDisplayed(false);
                updateErrorMessage('');
            }, 5000);
        }
    }
    return (<>
    {displayed ? <p className={`error error-displayed`}>{errorMessage}</p> : <p className={'error'}></p>}
    </>);
}