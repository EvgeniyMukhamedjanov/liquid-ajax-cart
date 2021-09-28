import { settings } from './settings';
import { cartRequestChange } from './ajax-api';
import { getCartState } from './state';

const ACTION_TOGGLE = 'toggle';
const ACTION_ADD = 'add';
const ACTION_REMOVE = 'remove';

document.addEventListener('click', function(e) {
	const { quantityButtonAttribute, toggleClassButtonAttribute } = settings.computed;

    for (var target = e.target; target && target != this; target = target.parentNode) {
        if (target.matches( `[${ quantityButtonAttribute }]` )) {
            quantityButtonClickHandler.call(target, e);
            break;
        }
        if (target.matches( `[${ toggleClassButtonAttribute }]` )) {
            toggleClassButtonClickHandler.call(target, e);
            break;
        }
    }
}, false);

function quantityButtonClickHandler (e) {
	e.preventDefault();
	const { quantityButtonAttribute } = settings.computed;
	const state = getCartState();
	if ( true || !state.status.requestInProgress ) {
		const [ itemKey, quantity ] = this.getAttribute( quantityButtonAttribute ).split('|');
		cartRequestChange({
			'id': itemKey.trim(),
			'quantity':  parseInt(quantity.trim()),
		});
	}
}

function toggleClassButtonClickHandler (e) {
	e.preventDefault();
	const { toggleClassButtonAttribute } = settings.computed;
	const parameters = this.getAttribute( toggleClassButtonAttribute ).split( '|' );
	if ( !parameters ) {
		console.error('Liquid Ajax Cart: Error while toggling body class');
		return;
	}

	const cssClass = parameters[0].trim();
	let action = parameters[1] ? parameters[1].trim() : ACTION_TOGGLE;
	if ( action !== ACTION_ADD && action !== ACTION_REMOVE ) {
		action = ACTION_TOGGLE;
	}


	if ( cssClass ) {
		try {
			if ( action === ACTION_ADD ) {
				document.body.classList.add( cssClass );
			} else if ( action === ACTION_REMOVE ) {
				document.body.classList.remove( cssClass );
			} else {
				document.body.classList.toggle( cssClass );
			}
        } catch (e) {
        	console.error('Liquid Ajax Cart: Error while toggling body class:', cssClass)
        	console.error(e);
        }
	}
}