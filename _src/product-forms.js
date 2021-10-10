import { settings } from './settings';
import { cartRequestAdd } from './ajax-api';

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
	
	// if the form has ana Ajax request in progress — ignore the submit
	if ( processesAmountBefore > 0 ) {
		return;
	}

	const formData = new FormData(form);
	// const searchParams = new URLSearchParams(formData);
	// const productJson = {}
	// for ( let pair of formData ) {
	// 	const key = pair[0];
	// 	const value = pair[1]
	// 	if( ['quantity', 'id', 'selling_plan'].includes( key ) ) {
	// 		productJson[key] = value;
	// 	}
	// 	if ( key.indexOf('properties[') === 0 && key.slice( -1 ) === ']' ) {
	// 		if ( !('properties' in productJson) ) {
	// 			productJson.properties = {};
	// 		}
	// 		productJson.properties[key.slice(11, -1)] = value;
	// 	}
	// }
	// if ( !('id' in productJson) ) {
	// 	// todo : throw error if "id" is not set
	// 	return;
	// }
	// if( !('quantity' in productJson) ) {
	// 	productJson.quantity = 1;
	// }

	processesAmount.set( form, processesAmountBefore + 1 );
	updateFormHTML( form );

	cartRequestAdd( formData, {
		"lastComplete": requestState => {
			if ( 'responseData' in requestState ) {
				if ( !(requestState.responseData.ok) ) {
					if ( 'description' in requestState.responseData.body ) {
						errorMessage = requestState.responseData.body.description;
					} else if ( 'message' in requestState.responseData.body ) {
						errorMessage = requestState.responseData.body.message;
					} else {
						errorMessage = `Error ${ requestState.responseData.status }`;
					}
				}
			} else {
				if ('fetchError' in requestState) { 
					errorMessage = requestState.fetchError;
				}
				// todo: add default error message like "Unknown Error" that will show up if no condition is true
			}

			const processesAmountAfter = processesAmount.get( form );
			if ( processesAmountAfter > 0 ) {
				processesAmount.set( form, processesAmountAfter - 1 );
			}

			updateFormHTML( form, errorMessage );
		}
	})
})

function updateFormHTML ( form, errorMessage = '' ) {
	form.querySelectorAll(`[${ settings.computed.productFormsErrorsAttribute }]`).forEach( errorsContainer => {
		if ( errorMessage ) {
			errorsContainer.innerText = errorMessage;
		} else {
			errorsContainer.innerText = '';
		}
	});
	

	// const submitButtons = form.querySelectorAll('input[type=submit], button[type=submit]');
	const formProcessesAmount = processesAmount.get( form );

	if ( settings.computed.productFormsProcessingClass ) {
		if ( formProcessesAmount > 0 ) {
			form.classList.add( settings.computed.productFormsProcessingClass );
		} else {
			form.classList.remove( settings.computed.productFormsProcessingClass );
		}
	}

	// if ( settings.productFormsButtonProcessingClass || settings.productFormsButtonProcessingDisabledAttribute ) {
	// 	form.querySelectorAll('input[type=submit], button[type=submit]').forEach( button => {
	// 		if ( formProcessesAmount > 0 ) {
	// 			if ( settings.productFormsButtonProcessingClass ) {
	// 				button.classList.add( settings.productFormsButtonProcessingClass );
	// 			}
	// 			if ( settings.productFormsButtonProcessingDisabledAttribute ) {
	// 				button.disabled = true;
	// 			}
	// 		} else {
	// 			if ( settings.productFormsButtonProcessingClass ) {
	// 				button.classList.remove( settings.productFormsButtonProcessingClass );
	// 			}
	// 			if ( settings.productFormsButtonProcessingDisabledAttribute ) {
	// 				button.disabled = false;
	// 			}
	// 		}
	// 	});
	// }
}