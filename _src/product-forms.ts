import { 
	RequestStateType
} from './ts-types';

import { settings } from './settings';
import { cartRequestAdd } from './ajax-api';

const processesAmount = new WeakMap();

const cartProductFormsInit = () => {
	document.addEventListener('submit', e => {

		const form = e.target as HTMLFormElement;
		let processesAmountBefore;
		// let errorMessage = '';

		const formActionUrl = new URL(form.action);
		if (formActionUrl.pathname !== `${ window.Shopify?.routes?.root || '/' }cart/add`) {
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

		processesAmount.set( form, processesAmountBefore + 1 );
		updateFormHTML( form );

		cartRequestAdd( formData, {
			lastComplete: (requestState: RequestStateType) => {

				const processesAmountAfter = processesAmount.get( form );
				if ( processesAmountAfter > 0 ) {
					processesAmount.set( form, processesAmountAfter - 1 );
				}

				updateFormHTML( form );
			},
			newQueue: true,
			info: {
				"initiator": form
			}
		})
	})
}

function updateFormHTML ( form: HTMLFormElement ) {

	const formProcessesAmount = processesAmount.get( form );

	if ( settings.computed.productFormsProcessingClass ) {
		if ( formProcessesAmount > 0 ) {
			form.classList.add( settings.computed.productFormsProcessingClass );
		} else {
			form.classList.remove( settings.computed.productFormsProcessingClass );
		}
	}
}

export { cartProductFormsInit }