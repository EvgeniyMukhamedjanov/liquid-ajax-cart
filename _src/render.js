import { createElement, render, Component, h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';
import { changeCartItem, getCartState, subscribeToCartState, unsubscribeFromCartState } from './state';

const html = htm.bind(h);

const useStatefulCart = () => {
	const [componentState, setComponentState] = useState( getCartState() );
	const [subscriptionId, setSubscriptionId] = useState();
	useEffect(() => {
		setSubscriptionId( subscribeToCartState( setComponentState ) );

		return () => {
			unsubscribeFromCartState( subscriptionId );
		}
	}, [])
	return componentState;
}

const CartComponent = ({ component }) => {
	const state = useStatefulCart();

	return html`
		<${component} 
			state=${ state }
			html=${ html }
		/>
	`;
}

const QuantityButton = ({ item, delta, children, ...props }) => {
	
	const newQuantity = item.quantity + parseInt(delta);
	if ( isNaN( newQuantity ) ) {
		// todo: throw an error
		return false;
	}

	return html`
		<button
			...${ props }
			onclick=${ () => {
				changeCartItem( item.key, newQuantity );
			}}
		>
			${ children }
		</button>
	`;
}

const renderCart = (component, container) => {
	render(html`<${CartComponent} component=${ component } />`, container);
}

export {
	renderCart,
	useState,
	useEffect,
	QuantityButton
}