import { createRoot, render } from '@wordpress/element';

import './styles.css';
import App from './App';

const rootElement = document.getElementById( 'niftyconnect-admin' );

if ( rootElement ) {
	if ( typeof createRoot === 'function' ) {
		createRoot( rootElement ).render( <App /> );
	} else {
		render( <App />, rootElement );
	}
}
