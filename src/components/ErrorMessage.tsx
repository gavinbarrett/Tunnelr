import * as React from 'react';
import { Messages } from '../Messages';
import './sass/ErrorMessage.scss';

export const ErrorMessage = ({displayed}) => {
    const { errorMessage, updateErrorMessage } = React.useContext(Messages);
    React.useEffect(() => {
        console.log('Display change');
    }, [displayed]);
    return (<>
    {displayed ? <p className={`error error-displayed`}>{errorMessage}</p> : <p className={'error'}></p>}
    </>);
}