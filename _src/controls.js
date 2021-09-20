import { settings } from './settings';
import { cartChange } from './ajax-api';
import { getCartState } from './state';

const quantityButtonAttribute = settings.computed.quantityButtonAttribute;

document.addEventListener('click', function(e) {
    for (var target = e.target; target && target != this; target = target.parentNode) {
        if (target.matches( `[${ quantityButtonAttribute }]` )) {
            quantityButtonClickHandler.call(target, e);
            break;
        }
    }
}, false);

function quantityButtonClickHandler (e) {
	const state = getCartState();
	if ( !state.status.requestInProgress ) {
		const [ itemKey, quantity ] = this.getAttribute( quantityButtonAttribute ).split('|');
		cartChange({
			'id': itemKey.trim(),
			'quantity':  parseInt(quantity.trim()),
		});
	}
}