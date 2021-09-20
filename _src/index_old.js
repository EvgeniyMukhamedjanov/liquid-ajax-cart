import { 
	changeCartItem,
	getCartState,
	refreshCartState, 
	setCartJson, 
	subscribeToCartState, 
	unsubscribeFromCartState
} from './state';

export * from './render';
export { 
	changeCartItem,
	getCartState,
	refreshCartState, 
	setCartJson, 
	subscribeToCartState, 
	unsubscribeFromCartState
}
export * from './dom-binder';

subscribeToCartState(console.log);




// function AjaxCart1 () {
// 	const state = useStatefulCart();

// 	const cartState = state.cart;
// 	const formState = state.form_controls;

// 	// console.log(state);

// 	return html`
// 		<div><button onClick=${getCart}>Test</button></div>

// 		${'items' in cartState && cartState.items.map(element => {
// 			const properties = [];
// 			for(let propertyName in element.properties) {
// 				properties.push({
// 					name: propertyName,
// 					value: element.properties[propertyName]
// 				})
// 			}
// 			const packages = [ 'Red', 'Blue', 'Yellow' ];
// 			return html`
// 				<div style="padding: 20px;" key=${element.key}>
// 					<p>${element.product_title} — ${element.quantity}</p>
// 					<p>
// 						<button onClick=${() => setItemState(element.key, element.quantity - 1)}>-</button>
// 						<button onClick=${() => setItemState(element.key, element.quantity + 1)}>+</button>
// 					</p>
// 					<p>
// 						<input 
// 							value=${ formState.items[element.key].quantity } 
// 							type="text" 
// 							oninput=${ e => formQuantityControlChange(element.key, e.target.value) }
// 							onChange=${ e => {
// 								if (element.quantity !== parseInt(e.target.value) ) {
// 									setItemState(element.key, e.target.value) 
// 								}
// 							}} 
// 							onKeyDown=${ e => {
// 								if (e.keyCode === 27) {
// 									e.currentTarget.value = element.quantity
// 									e.currentTarget.blur();
// 								}
// 							}}
// 						/>
// 					</p>
// 					<p>
// 						${ properties.map( property => html`
// 							<p>
// 								${ property.name }: ${ property.value }
// 								${ property.name === 'Engraving' && html`
// 									<input 
// 										type="text"
// 										value=${ 'Engraving' in formState.items[element.key].properties ? formState.items[element.key].properties['Engraving'] : '' }
// 										oninput=${ e => formPropertyControlChange(element.key, 'Engraving', e.target.value)}
// 									/>
// 								` }
// 								${ property.name === 'Package' && packages.map(packageName =>  html`
// 									<label>
// 										<input 
// 											type="radio" 
// 											name="${element.key}_package" 
// 											value="${packageName}" 
// 											checked="${ 'Package' in formState.items[element.key].properties && formState.items[element.key].properties['Package'] === packageName }"
// 											onChange=${ e => formPropertyControlChange(element.key, 'Package', e.target.value) }
// 										/> ${packageName}
// 									</label>
// 								` ) }
// 								${ property.name === 'Remove Price Tag' && html`
// 									<label>
// 										<input 
// 											type="checkbox"  
// 											value="Yes" 
// 											checked="${ 'Remove Price Tag' in formState.items[element.key].properties && formState.items[element.key].properties['Remove Price Tag'] !== 'No' }"
// 											onChange=${ e => formPropertyControlChange(element.key, 'Remove Price Tag', e.target.checked ? 'Yes' : 'No') }
// 										/> Remove Price Tag
// 									</label>
// 								` }

// 							</p>
// 						` ) }
// 					</p>
// 				</div>
// 			`;
// 		})}
// 	`;
// }









//  {
// 	disabled: false,
// 	filter: formNode => true,
// 	processingIgnoreSubmit: true,
// 	processingFormClass: '',
// 	processingButtonClass: '',
// 	processingButtonDisabledAttribute: false,
// 	callbackBefore: formNode => {},
// 	callbackAafter: formNode => {}
// }

let ajaxFormsOptions = { 
	disabled: true 
};

const ajaxFormsProcessesAmount = new WeakMap();

export function ajaxifyProductForms( options = {} ) {
	ajaxFormsOptions = options;
	if ( !('processingIgnoreSubmit' in ajaxFormsOptions) ) {
		ajaxFormsOptions.processingIgnoreSubmit = true;
	}
}

document.addEventListener('submit', e => {

	if ( ajaxFormsOptions.disabled === true ) {
		return;
	}

	const form = e.target;
	let processesAmountBefore;

	const formActionUrl = new URL(e.target.action);
	if (formActionUrl.pathname !== '/cart/add') {
		return;
	}

	if ('filter' in ajaxFormsOptions && !ajaxFormsOptions.filter(form) ) {
		return;
	}

	e.preventDefault();

	processesAmountBefore = ajaxFormsProcessesAmount.get(form);
	if ( !(processesAmountBefore > 0) ) {
		processesAmountBefore = 0;
	}
	
	if ( ajaxFormsOptions.processingIgnoreSubmit && processesAmountBefore > 0 ) {
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

	ajaxFormsProcessesAmount.set( form, processesAmountBefore + 1 );
	ajaxFormsDOM( form );

	fetch('/cart/add.js', {
		method: 'POST',
	 	headers: {
	    	'Content-Type': 'application/json'
	  	},
	  	body: JSON.stringify({
	  		items: [ productJson ]
	  	})
	})
	.then(response => {
		if (response.ok) {
			return response.json();
		}
	  	throw response;
	}).then(data => {
		// todo: analize response

		return fetch('/cart.js', {
			method: 'GET',
		 	headers: {
		    	'Content-Type': 'application/json'
		  	}
		});
	}).then(response => {
		if (response.ok) {
			return response.json();
			// return new Promise((resolve, reject) => {
			//  	setTimeout(() => {
			//     	resolve(response.json());
			// 	}, 1000);
			// })
		}
	  	throw response;
	}).then(data => {
		setState({
			cart: data
		});
	}).catch((error) => {
	  	console.error('Error:', error);
	}).finally(() => {
		const processesAmountAfter = ajaxFormsProcessesAmount.get( form );
		if ( processesAmountAfter > 0 ) {
			ajaxFormsProcessesAmount.set( form, processesAmountAfter - 1 );
		}
		ajaxFormsDOM( form );
	});
})

function ajaxFormsDOM ( form ) {
	const submitButtons = form.querySelectorAll('input[type=submit], button[type=submit]');
	const processesAmount = ajaxFormsProcessesAmount.get( form );

	if ( ajaxFormsOptions.processingFormClass ) {
		if ( processesAmount > 0 ) {
			form.classList.add( ajaxFormsOptions.processingFormClass );
		} else {
			form.classList.remove( ajaxFormsOptions.processingFormClass );
		}
	}

	if ( ajaxFormsOptions.processingButtonClass || ajaxFormsOptions.processingButtonDisabledAttribute ) {
		form.querySelectorAll('input[type=submit], button[type=submit]').forEach( button => {
			if ( processesAmount > 0 ) {
				if ( ajaxFormsOptions.processingButtonClass ) {
					button.classList.add( ajaxFormsOptions.processingButtonClass );
				}
				if ( ajaxFormsOptions.processingButtonDisabledAttribute ) {
					button.disabled = true;
				}
			} else {
				if ( ajaxFormsOptions.processingButtonClass ) {
					button.classList.remove( ajaxFormsOptions.processingButtonClass );
				}
				if ( ajaxFormsOptions.processingButtonDisabledAttribute ) {
					button.disabled = false;
				}
			}
		} );
	}
}

document.addEventListener('click', function(e) {
    // loop parent nodes from the target to the delegation node
    for (var target = e.target; target && target != this; target = target.parentNode) {
        if (target.matches( '[data-ajax-cart-quantity-button]' )) {
            quantityButton.call(target, e);
            break;
        }
    }
}, false);

function quantityButton (button) {
	const [ itemKey, quantity ] = this.getAttribute('data-ajax-cart-quantity-button').split('|');
	console.log(itemKey, quantity);
	changeCartItem( itemKey.trim(), parseInt(quantity.trim()) );
}