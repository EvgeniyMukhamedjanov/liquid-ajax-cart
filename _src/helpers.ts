import { AppStateType, LineItemType } from './ts-types';

type CodeType = 'id' | 'line';
type LineItemByCodeType = [
	LineItemType | null | undefined,
	CodeType | undefined
]

export function findLineItemByCode(code: string, state: AppStateType): LineItemByCodeType {
	let lineItem: LineItemType | null | undefined = undefined;
	let codeType: CodeType | undefined = undefined;

	if (state.status.cartStateSet) {
		if ( code.length > 3 ) {
			lineItem = state.cart.items.find( (lineItem: LineItemType) => lineItem.key === code );
			codeType = 'id';
		} else {
			lineItem = state.cart.items[Number(code) - 1];
			codeType = 'line';
		}

		if (lineItem === undefined) {
			lineItem = null;
			console.error(`Liquid Ajax Cart: line item with ${ codeType }="${ code }" not found`);
		}
	}
	return [ lineItem, codeType ];
}