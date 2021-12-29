export function findLineItemByCode(code, state) {
	let lineItem = undefined;
	let codeType = undefined;

	if (state.status.cartStateSet) {
		if ( code.length > 3 ) {
			lineItem = state.cart.items.find( lineItem => lineItem.key === attributeValue );
			codeType = 'id';
		} else {
			lineItem = state.cart.items[Number(code) - 1];
			codeType = 'line';
		}

		if (lineItem === undefined) {
			lineItem = null;
		}
	}
	return [ lineItem, codeType ]
}