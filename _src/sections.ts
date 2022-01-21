import { RequestStateType, RequestResultSubscriberType, JSONValueType } from './ts-types';

import { subscribeToCartAjaxRequests, cartRequestUpdate } from './ajax-api';
import { settings } from './settings';

type ScrollAreasListType = {
	[scrollId: string]: number[]
}

const shopifySectionPrefix = 'shopify-section-';
const infoSectionsUpdateParam = '_liquid_ajax_cart_sections_update';

function cartSectionsInit() {
	subscribeToCartAjaxRequests (( requestState: RequestStateType, subscribeToResult: RequestResultSubscriberType ) => {
		const { sectionsAttribute, sectionScrollAreaAttribute } = settings.computed;

		if ( requestState.requestBody !== undefined ) {
			const sectionNames: string[] = [];
			if ( infoSectionsUpdateParam in requestState.info ) {
				sectionNames.push( ...requestState.info[infoSectionsUpdateParam] );
			} else {
				if ( requestState.requestBody instanceof FormData || requestState.requestBody instanceof URLSearchParams ) {
					const userRequestedSections = requestState.requestBody.get('sections');
					if ( typeof userRequestedSections === 'string' || userRequestedSections instanceof String ) {
						sectionNames.push( ...userRequestedSections.split(',') );
					}
				} else {
					const userRequestedSections = requestState.requestBody.sections;
					if ( typeof userRequestedSections === 'string' || userRequestedSections instanceof String ) {
						sectionNames.push( ...userRequestedSections.split(',') );
					}
					requestState.requestBody.sections = '';
				}

				document.querySelectorAll( `[${ sectionsAttribute }]` ).forEach( sectionNodeChild => {
					const sectionNode = sectionNodeChild.closest(`[id^="${ shopifySectionPrefix }"]`);
					if ( sectionNode ) {
						const sectionId = sectionNode.id.replace( shopifySectionPrefix, '' );
						if ( sectionNames.indexOf( sectionId ) === -1 ) {
							sectionNames.push( sectionId );
						}
					} else {
						console.error(`Liquid Ajax Cart: there is a ${ sectionsAttribute } element that is not inside a Shopify section`);
					}
				});
			}
			if ( sectionNames.length ) {
				const currentSectionNames = sectionNames.slice(0, 5);
				requestState.info[infoSectionsUpdateParam] = sectionNames.slice(5);

				// todo: don't override the current 'sections' param
				if ( requestState.requestBody instanceof FormData || requestState.requestBody instanceof URLSearchParams ) {
					requestState.requestBody.set('sections', currentSectionNames.join( ',' ));
				} else {
					requestState.requestBody.sections = currentSectionNames.join( ',' );
				}
			}
		}

		subscribeToResult(( requestState: RequestStateType ) => {
			const { sectionsAttribute, sectionScrollAreaAttribute } = settings.computed;
			const parser = new DOMParser();

			if ( requestState.responseData?.ok && 'sections' in requestState.responseData.body ) {
				const sections = requestState.responseData.body.sections as (({ [key: string]: string }));
				for ( let sectionId in sections ) {
					if ( !sections[ sectionId ] ) {
						console.error(`Liquid Ajax Cart: the HTML for the "${ sectionId }" section was requested but the response is ${ sections[ sectionId ] }`)
						continue;
					}

					document.querySelectorAll( `#shopify-section-${ sectionId }` ).forEach( sectionNode => {

						// let newSectionNode = sectionNode;

						// Memorize scroll positions
						const noId = "__noId__";
						const scrollAreasList: ScrollAreasListType = {};
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
						const sectionParts = sectionNode.querySelectorAll( `[${ sectionsAttribute }]` );
						if ( sectionParts ) {
      						const receivedDOM = parser.parseFromString(sections[ sectionId ], "text/html");
      						const receivedParts = receivedDOM.querySelectorAll( `[${ sectionsAttribute }]` );
      						if ( sectionParts.length !== receivedParts.length ) {
      							console.error(`Liquid Ajax Cart: the received HTML for the "${ sectionId }" section has a different quantity of the "${ sectionsAttribute }" containers. The section will be updated completely.`);
      							const receivedSection = receivedDOM.querySelector(`#${ shopifySectionPrefix }${ sectionId }`);
								if ( receivedSection ) {
									sectionNode.innerHTML = receivedSection.innerHTML;
								}
      						} else {
      							sectionParts.forEach(( sectionPartsItem, sectionPartsItemIndex ) => {
      								sectionPartsItem.before( receivedParts[sectionPartsItemIndex] );
									sectionPartsItem.parentElement.removeChild(sectionPartsItem);
      							});
      						}
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

				if ( infoSectionsUpdateParam in requestState.info && requestState.info[infoSectionsUpdateParam].length > 0 ) {
					// todo: improve text
					console.warn(`Liquid Ajax Cart: there were more than 5 sections requested`);
					cartRequestUpdate({}, { 
						info: { 
							[infoSectionsUpdateParam]: requestState.info[infoSectionsUpdateParam] 
						}
					});
				}
			}
		})
	})
}

export { cartSectionsInit };