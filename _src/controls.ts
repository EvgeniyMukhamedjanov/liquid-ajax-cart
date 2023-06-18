import { cartRequestButtonInit } from './controls/request-button';
import { cartQuantityInputInit } from './controls/quantity-input';
import { cartPropertyInputInit } from './controls/property-input';
// import { cartToggleClassButtonInit } from './controls/toggle-class-button';

function cartControlsInit () {
	cartRequestButtonInit();
	cartPropertyInputInit();
	cartQuantityInputInit();
	// cartToggleClassButtonInit();
}

export { cartControlsInit }