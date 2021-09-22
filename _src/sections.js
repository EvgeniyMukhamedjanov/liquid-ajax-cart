import { subscribeToAjaxAPI } from './ajax-api';
import { settings } from './settings';

const shopifySectionPrefix = 'shopify-section-';

subscribeToAjaxAPI ( data => {
	const sectionsAttribute = settings.computed.sectionsAttribute;

	if ( !('responseData' in data) ) {
		// this is callback before request is started
		// we need to add 'sections' parameter to the requestBody
		// to receive update HTML for sections
		if ( 'requestBody' in data ) {
			const sectionNames = [];
			// todo: test with dynamic sections
			document.querySelectorAll( `[${ sectionsAttribute }]` ).forEach( sectionNodeChild => {
				let sectionIdHTML = sectionNodeChild.parentElement.id;
				if ( sectionIdHTML.indexOf( shopifySectionPrefix ) === 0 ) {
					const sectionId = sectionIdHTML.replace( shopifySectionPrefix, '' );
					if ( sectionNames.indexOf( sectionId ) === -1 ) {
						sectionNames.push( sectionId );
					}
				}
			});
			if ( sectionNames.length ) {
				data.requestBody.sections = sectionNames.join( ',' );
			}
		}
	} else {
		if ( data.responseData.ok && 'sections' in data.responseData.body ) {
			const sections = data.responseData.body.sections;
			for ( let sectionId in sections ) {
				document.querySelectorAll( `#shopify-section-${ sectionId } > [${ sectionsAttribute }]` ).forEach( sectionNodeChild => {
					sectionNodeChild.parentNode.outerHTML = sections[ sectionId ];
				})
			}
		}
	}
})