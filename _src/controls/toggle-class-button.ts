import { settings } from './../settings';

const ACTION_TOGGLE = 'toggle';
const ACTION_ADD = 'add';
const ACTION_REMOVE = 'remove';

function clickHandler (element: Element, e: Event) {
	const { toggleClassButtonAttribute } = settings.computed;

	if (!( element.hasAttribute( toggleClassButtonAttribute ) )) {
		return;
	}

	if(e) {
		e.preventDefault();
	}
	const parameters = element.getAttribute( toggleClassButtonAttribute ).split( '|' );
	if ( !parameters ) {
		console.error('Liquid Ajax Cart: Error while toggling body class');
		return;
	}

	const cssClass = parameters[0].trim();
	let action = parameters[1] ? parameters[1].trim() : ACTION_TOGGLE;
	if ( action !== ACTION_ADD && action !== ACTION_REMOVE ) {
		action = ACTION_TOGGLE;
	}


	if ( cssClass ) {
		try {
			if ( action === ACTION_ADD ) {
				document.body.classList.add( cssClass );
			} else if ( action === ACTION_REMOVE ) {
				document.body.classList.remove( cssClass );
			} else {
				document.body.classList.toggle( cssClass );
			}
        } catch (e) {
        	console.error('Liquid Ajax Cart: Error while toggling body class:', cssClass)
        	console.error(e);
        }
	}
}

function cartToggleClassButtonInit () {
	document.addEventListener('click', function(e) {
	    for (let target = (e.target as Element); target && target != document.documentElement; target = target.parentElement) {
			clickHandler(target, e);
	    }
	}, false);
}

export { cartToggleClassButtonInit }