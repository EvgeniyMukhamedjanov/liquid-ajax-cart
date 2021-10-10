import { subscribeToCartAjaxRequests } from './ajax-api';
import { settings } from './settings';

const shopifySectionPrefix = 'shopify-section-';

subscribeToCartAjaxRequests (( data, subscribeToResult ) => {
	const { sectionsAttribute, sectionScrollAreaAttribute } = settings.computed;

	if ( data.requestBody !== undefined ) {
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
			if ( data.requestBody instanceof FormData || data.requestBody instanceof URLSearchParams ) {
				data.requestBody.append('sections', sectionNames.join( ',' ));
			} else {
				data.requestBody.sections = sectionNames.join( ',' );
			}
		}
	}

	subscribeToResult( data => {
		const { sectionsAttribute, sectionScrollAreaAttribute } = settings.computed;

		if ( 'responseData' in data && data.responseData.ok && 'sections' in data.responseData.body ) {
			const sections = data.responseData.body.sections;
			for ( let sectionId in sections ) {
				document.querySelectorAll( `#shopify-section-${ sectionId } > [${ sectionsAttribute }]` ).forEach( sectionNodeChild => {
					const noId = "__noId__"
					const scrollAreasList = {};
					const oldSectionNode = sectionNodeChild.parentNode;
					sectionNodeChild.parentNode.querySelectorAll(` [${ sectionScrollAreaAttribute }] `).forEach( scrollAreaNode => {
						let scrollId = scrollAreaNode.getAttribute( sectionScrollAreaAttribute ).toString().trim();
						if ( scrollId === '' ) {
							scrollId = noId;
						}
						if ( !(scrollId in scrollAreasList) ) {
							scrollAreasList[scrollId] = [];
						}
						scrollAreasList[scrollId].push(scrollAreaNode.scrollTop);
					});
					oldSectionNode.insertAdjacentHTML('beforeBegin', sections[ sectionId ]);
					const newSectionNode = oldSectionNode.previousSibling;
					oldSectionNode.parentElement.removeChild(oldSectionNode);
					for ( let scrollId in scrollAreasList ) {
						newSectionNode.querySelectorAll(` [${ sectionScrollAreaAttribute }="${ scrollId.replace( noId, '' ) }"] `).forEach(( scrollAreaNode, scrollAreaIndex ) => {
							if ( scrollAreaIndex + 1 <= scrollAreasList[ scrollId ].length ) {
								scrollAreaNode.scrollTop = scrollAreasList[ scrollId ][ scrollAreaIndex ];
							}
						})
					}
				})
			}
		}
	})
})