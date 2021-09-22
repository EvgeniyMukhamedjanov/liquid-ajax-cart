import { settings } from './settings';
import { cartChange } from './ajax-api';
import { getCartState } from './state';

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
	if ( !state.status.requestInProgress ) {
		const [ itemKey, quantity ] = this.getAttribute( quantityButtonAttribute ).split('|');
		cartChange({
			'id': itemKey.trim(),
			'quantity':  parseInt(quantity.trim()),
		});
	}
}

function toggleClassButtonClickHandler (e) {
	e.preventDefault();
	const { toggleClassButtonAttribute } = settings.computed;
	let cssClass = this.getAttribute( toggleClassButtonAttribute ).trim();
	// todo: check if it is valid css class
	
	if ( cssClass ) {
        document.body.classList.toggle( cssClass );
	}
	// todo: throw error if something wrong with cssClass
}