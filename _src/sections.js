import { subscribeToCartAjaxRequests } from './ajax-api';
import { settings } from './settings';

const shopifySectionPrefix = 'shopify-section-';

const cartSectionsInit = () => {
	subscribeToCartAjaxRequests (( requestState, subscribeToResult ) => {
		const { sectionsAttribute, sectionScrollAreaAttribute } = settings.computed;

		if ( requestState.requestBody !== undefined ) {
			const sectionNames = [];
			// todo: test with dynamic sections
			document.querySelectorAll( `[${ sectionsAttribute }]` ).forEach( sectionNodeChild => {
				const sectionNode = sectionNodeChild.closest(`[id^="${ shopifySectionPrefix }"]`);
				// let sectionIdHTML = sectionNodeChild.parentElement.id;
				// if ( sectionIdHTML.indexOf( shopifySectionPrefix ) === 0 ) {
				// 	const sectionId = sectionIdHTML.replace( shopifySectionPrefix, '' );
				// 	if ( sectionNames.indexOf( sectionId ) === -1 ) {
				// 		sectionNames.push( sectionId );
				// 	}
				// }
				if ( sectionNode ) {
					const sectionId = sectionNode.id.replace( shopifySectionPrefix, '' );
					if ( sectionNames.indexOf( sectionId ) === -1 ) {
						sectionNames.push( sectionId );
					}
				}
			});
			if ( sectionNames.length ) {
				if ( requestState.requestBody instanceof FormData || requestState.requestBody instanceof URLSearchParams ) {
					requestState.requestBody.append('sections', sectionNames.join( ',' ));
				} else {
					requestState.requestBody.sections = sectionNames.join( ',' );
				}
			}
		}

		subscribeToResult( requestState => {
			const { sectionsAttribute, sectionScrollAreaAttribute } = settings.computed;
			const parser = new DOMParser();

			if ( requestState.responseData?.ok && 'sections' in requestState.responseData.body ) {
				const sections = requestState.responseData.body.sections;
				for ( let sectionId in sections ) {
					if ( !sections[ sectionId ] ) {
						console.error(`Liquid Ajax Cart: the HTML for the "${ sectionId }" section was requested but the response is ${ sections[ sectionId ] }`)
						continue;
					}

					document.querySelectorAll( `#shopify-section-${ sectionId }` ).forEach( sectionNode => {

						// let newSectionNode = sectionNode;

						// Memorize scroll positions
						const noId = "__noId__";
						const scrollAreasList = {};
						sectionNode.querySelectorAll(` [${ sectionScrollAreaAttribute }] `).forEach( scrollAreaNode => {
							let scrollId = scrollAreaNode.getAttribute( sectionScrollAreaAttribute ).toString().trim();
							if ( scrollId === '' ) {
								scrollId = noId;
							}
							if ( !(scrollId in scrollAreasList) ) {
								scrollAreasList[scrollId] = [];
							}
							scrollAreasList[scrollId].push(scrollAreaNode.scrollTop);
						});

						// Replace HTML
						let updateFullSection = false;
						if ( sectionNode.querySelector(`:scope > [${ sectionsAttribute }]`) ) {
							updateFullSection = true;
						} else {
							const sectionParts = sectionNode.querySelectorAll( `[${ sectionsAttribute }]` );
							if ( sectionParts ) {
          						const receivedDOM = parser.parseFromString(sections[ sectionId ], "text/html");
          						const receivedParts = receivedDOM.querySelectorAll( `[${ sectionsAttribute }]` );
          						if ( sectionParts.length !== receivedParts.length ) {
          							updateFullSection = true;
          							console.error(`Liquid Ajax Cart: the received HTML for the "${ sectionId }" section has a different quantity of the "${ sectionsAttribute }" containers. The section will be updated completely.`);
          						} else {
          							sectionParts.forEach(( sectionPartsItem, sectionPartsItemIndex ) => {
          								sectionPartsItem.before( receivedParts[sectionPartsItemIndex] );
										sectionPartsItem.parentElement.removeChild(sectionPartsItem);
          							});
          						}
							}
						}
						if ( updateFullSection ) {
							const receivedDOM = parser.parseFromString(sections[ sectionId ], "text/html");
							const receivedSection = receivedDOM.querySelector(`#${ shopifySectionPrefix }${ sectionId }`);
							if ( receivedSection ) {
								sectionNode.innerHTML = receivedSection.innerHTML;
							}
							// sectionNode.insertAdjacentHTML('beforeBegin', sections[ sectionId ]);
							// newSectionNode = sectionNode.previousSibling;
							// sectionNode.parentElement.removeChild(sectionNode);
						}

						// Restore scroll positions
						for ( let scrollId in scrollAreasList ) {
							sectionNode.querySelectorAll(` [${ sectionScrollAreaAttribute }="${ scrollId.replace( noId, '' ) }"] `).forEach(( scrollAreaNode, scrollAreaIndex ) => {
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
}

export { cartSectionsInit };