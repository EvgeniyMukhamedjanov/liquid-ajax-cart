import { settings } from './../settings';

const ACTION_TOGGLE = 'toggle';
const ACTION_ADD = 'add';
const ACTION_REMOVE = 'remove';

function clickHandler (htmlNode, e) {
	const { toggleClassButtonAttribute } = settings.computed;

	if (!( htmlNode.hasAttribute( toggleClassButtonAttribute ) )) {
		return;
	}

	if(e) {
		e.preventDefault();
	}
	const parameters = htmlNode.getAttribute( toggleClassButtonAttribute ).split( '|' );
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
	    for (var target = e.target; target && target != this; target = target.parentNode) {
			clickHandler(target, e);
	    }
	}, false);
}

export { cartToggleClassButtonInit }