import { settings } from './settings';
import { cartAdd } from './ajax-api';

const processesAmount = new WeakMap();

document.addEventListener('submit', e => {

	const form = e.target;
	let processesAmountBefore;
	let errorMessage = '';

	const formActionUrl = new URL(e.target.action);
	if (formActionUrl.pathname !== '/cart/add') {
		return;
	}

	if ('productFormsFilter' in settings && !settings.productFormsFilter(form) ) {
		return;
	}

	e.preventDefault();

	processesAmountBefore = processesAmount.get(form);
	if ( !(processesAmountBefore > 0) ) {
		processesAmountBefore = 0;
	}
	
	if ( settings.productFormsIgnoreSubmitOnProcessing && processesAmountBefore > 0 ) {
		return;
	}

	const formData = new FormData(form);
	const productJson = {}
	for ( let pair of formData ) {
		const key = pair[0];
		const value = pair[1]
		if( ['quantity', 'id', 'selling_plan'].includes( key ) ) {
			productJson[key] = value;
		}
		if ( key.indexOf('properties[') === 0 && key.slice( -1 ) === ']' ) {
			if ( !('properties' in productJson) ) {
				productJson.properties = {};
			}
			productJson.properties[key.slice(11, -1)] = value;
		}
	}
	if ( !('id' in productJson) ) {
		// todo : throw error if "id" is not set
		return;
	}
	if( !('quantity' in productJson) ) {
		productJson.quantity = 1;
	}

	processesAmount.set( form, processesAmountBefore + 1 );
	updateFormHTML( form );

	cartAdd({
		items: [ productJson ]
	}).then( data => {

		if ( !(data.ok) ) {
			if ( 'description' in data.body ) {
				errorMessage = data.body.description;
			} else if ( 'message' in data.body ) {
				errorMessage = data.body.message;
			} else {
				errorMessage = `Error ${ data.status }`;
			}
		}

	}).finally(() => {
		const processesAmountAfter = processesAmount.get( form );
		if ( processesAmountAfter > 0 ) {
			processesAmount.set( form, processesAmountAfter - 1 );
		}
		// todo check if the previous "then" is not performed, it means there was an error in ajax-api "catch"
		// most likely internet connection error
		updateFormHTML( form, errorMessage );
	});
})

function updateFormHTML ( form, errorMessage = '' ) {
	form.querySelectorAll(`[${ settings.computed.productFormsErrorsAttribute }]`).forEach( errorsContainer => {
		if ( errorMessage ) {
			errorsContainer.innerText = errorMessage;
		} else {
			errorsContainer.innerText = '';
		}
	});
	

	const submitButtons = form.querySelectorAll('input[type=submit], button[type=submit]');
	const formProcessesAmount = processesAmount.get( form );

	if ( settings.productFormsProcessingClass ) {
		if ( formProcessesAmount > 0 ) {
			form.classList.add( settings.productFormsProcessingClass );
		} else {
			form.classList.remove( settings.productFormsProcessingClass );
		}
	}

	if ( settings.productFormsButtonProcessingClass || settings.productFormsButtonProcessingDisabledAttribute ) {
		form.querySelectorAll('input[type=submit], button[type=submit]').forEach( button => {
			if ( formProcessesAmount > 0 ) {
				if ( settings.productFormsButtonProcessingClass ) {
					button.classList.add( settings.productFormsButtonProcessingClass );
				}
				if ( settings.productFormsButtonProcessingDisabledAttribute ) {
					button.disabled = true;
				}
			} else {
				if ( settings.productFormsButtonProcessingClass ) {
					button.classList.remove( settings.productFormsButtonProcessingClass );
				}
				if ( settings.productFormsButtonProcessingDisabledAttribute ) {
					button.disabled = false;
				}
			}
		});
	}
}