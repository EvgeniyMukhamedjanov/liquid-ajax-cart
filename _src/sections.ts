import {
  RequestStateType,
  // RequestResultSubscriberType,
  JSONValueType,
  UpdatedSectionType,
  // SectionsSubscriberType,
  EventSectionsType,
  EventRequestType
} from './ts-types';

import {EVENT_REQUEST, /*subscribeToCartAjaxRequests,*/ REQUEST_ADD} from './ajax-api';
import {settings} from './settings';
import {EVENT_PREFIX} from "./const";

const EVENT_SECTIONS = `${EVENT_PREFIX}sections`;

type StaticElementsListType = {
  [elementId: string]: Array<Element>
}

type ScrollAreasListType = {
  [scrollId: string]: Array<{ scroll: number, height: number }>
}

const shopifySectionPrefix = 'shopify-section-';
// const subscribers: Array<SectionsSubscriberType> = [];

function cartSectionsInit() {
  // subscribeToCartAjaxRequests (( requestState: RequestStateType, subscribeToResult: RequestResultSubscriberType ) => {
  document.addEventListener(EVENT_REQUEST, (event: EventRequestType) => {
    const {requestState, onResult} = event.detail;

    const {sectionsAttribute, staticElementAttribute} = settings.computed;

    if (requestState.requestBody !== undefined) {
      const sectionNames: string[] = [];

      document.querySelectorAll(`[${sectionsAttribute}]`).forEach(sectionNodeChild => {
        const sectionNode = sectionNodeChild.closest(`[id^="${shopifySectionPrefix}"]`);
        if (sectionNode) {
          const sectionId = sectionNode.id.replace(shopifySectionPrefix, '');
          if (sectionNames.indexOf(sectionId) === -1) {
            sectionNames.push(sectionId);
          }
        } else {
          console.error(`Liquid Ajax Cart: there is a ${sectionsAttribute} element that is not inside a Shopify section. All the ${sectionsAttribute} elements must be inside Shopify sections.`);
        }
      });

      if (sectionNames.length) {
        let requestingSections = sectionNames.join(',');

        let sectionsParam: JSONValueType = undefined;
        if (requestState.requestBody instanceof FormData || requestState.requestBody instanceof URLSearchParams) {
          if (requestState.requestBody.has('sections')) {
            sectionsParam = requestState.requestBody.get('sections').toString();
          }
        } else {
          sectionsParam = requestState.requestBody.sections;
        }
        if (((typeof sectionsParam === 'string' || <JSONValueType>sectionsParam instanceof String) && <string>sectionsParam !== '')
          || (Array.isArray(sectionsParam) && sectionsParam.length > 0)) {
          requestingSections = `${(<string | string[]>sectionsParam).toString()},${requestingSections}`;
        }

        if (requestState.requestBody instanceof FormData || requestState.requestBody instanceof URLSearchParams) {
          requestState.requestBody.set('sections', requestingSections);
        } else {
          requestState.requestBody.sections = requestingSections;
        }
      }
    }

    onResult((requestState: RequestStateType) => {
      const {sectionsAttribute, sectionScrollAreaAttribute} = settings.computed;
      const parser = new DOMParser();
      const updatedSections: Array<UpdatedSectionType> = []; // for sections event

      if (requestState.responseData?.ok && 'sections' in requestState.responseData.body) {
        let sections = requestState.responseData.body.sections as ({ [key: string]: string });
        if (requestState.extraResponseData?.body?.sections) {
          sections = {...sections, ...(requestState.extraResponseData.body.sections as ({ [key: string]: string }))};
        }
        for (let sectionId in sections) {
          if (!sections[sectionId]) {
            console.error(`Liquid Ajax Cart: the HTML for the "${sectionId}" section was requested but the response is ${sections[sectionId]}`)
            continue;
          }

          document.querySelectorAll(`#shopify-section-${sectionId}`).forEach(sectionNode => {

            let newNodes: Array<Element> = []; // for sections event
            const noId = "__noId__"; // for memorizing scroll positions and static elements

            // Memorize scroll positions
            const scrollAreasList: ScrollAreasListType = {};
            sectionNode.querySelectorAll(` [${sectionScrollAreaAttribute}] `).forEach(scrollAreaNode => {
              let scrollId = scrollAreaNode.getAttribute(sectionScrollAreaAttribute).toString().trim();
              if (scrollId === '') {
                scrollId = noId;
              }
              if (!(scrollId in scrollAreasList)) {
                scrollAreasList[scrollId] = [];
              }
              scrollAreasList[scrollId].push({
                scroll: scrollAreaNode.scrollTop,
                height: scrollAreaNode.scrollHeight
              });
            });

            // Memorize static elements
            const staticElementsList: StaticElementsListType = {}
            const staticElements = sectionNode.querySelectorAll(`[${staticElementAttribute}]`);
            if (staticElements) {
              staticElements.forEach(staticElement => {
                let staticElementId = staticElement.getAttribute(staticElementAttribute).toString().trim();
                if (staticElementId === '') {
                  staticElementId = noId;
                }
                if (!(staticElementId in staticElementsList)) {
                  staticElementsList[staticElementId] = [];
                }
                staticElementsList[staticElementId].push(staticElement);
              })
            }

            // Replace HTML and Restore static elements
            const sectionParts = sectionNode.querySelectorAll(`[${sectionsAttribute}]`);
            if (sectionParts) {
              const receivedDOM = parser.parseFromString(sections[sectionId], "text/html");

              // Restore static elements
              for (let staticElementId in staticElementsList) {
                receivedDOM.querySelectorAll(` [${staticElementAttribute}="${staticElementId.replace(noId, '')}"] `).forEach((staticElement, staticElementIndex) => {
                  if (staticElementIndex + 1 <= staticElementsList[staticElementId].length) {
                    staticElement.before(staticElementsList[staticElementId][staticElementIndex]);
                    staticElement.parentElement.removeChild(staticElement);
                  }
                })
              }

              // Replace old sections with new sections
              const receivedParts = receivedDOM.querySelectorAll(`[${sectionsAttribute}]`);
              if (sectionParts.length !== receivedParts.length) {
                console.error(`Liquid Ajax Cart: the received HTML for the "${sectionId}" section has a different quantity of the "${sectionsAttribute}" containers. The section will be updated completely.`);
                const receivedSection = receivedDOM.querySelector(`#${shopifySectionPrefix}${sectionId}`);
                if (receivedSection) {
                  sectionNode.innerHTML = "";
                  while (receivedSection.childNodes.length) {
                    sectionNode.appendChild(receivedSection.firstChild);
                  }
                  newNodes.push(sectionNode);
                }
              } else {
                sectionParts.forEach((sectionPartsItem, sectionPartsItemIndex) => {
                  sectionPartsItem.before(receivedParts[sectionPartsItemIndex]);
                  sectionPartsItem.parentElement.removeChild(sectionPartsItem);
                  newNodes.push(receivedParts[sectionPartsItemIndex]);
                });
              }
            }

            // Restore scroll positions
            for (let scrollId in scrollAreasList) {
              sectionNode.querySelectorAll(` [${sectionScrollAreaAttribute}="${scrollId.replace(noId, '')}"] `).forEach((scrollAreaNode, scrollAreaIndex) => {
                if (scrollAreaIndex + 1 <= scrollAreasList[scrollId].length) {
                  if (requestState.requestType !== REQUEST_ADD || scrollAreasList[scrollId][scrollAreaIndex]['height'] >= scrollAreaNode.scrollHeight) {
                    scrollAreaNode.scrollTop = scrollAreasList[scrollId][scrollAreaIndex]['scroll'];
                  }
                }
              })
            }

            if (newNodes.length > 0) {
              updatedSections.push({
                id: sectionId,
                elements: newNodes
              });
            }
          })
        }
      }

      if (updatedSections.length > 0/* && subscribers.length > 0*/) {
        const event: EventSectionsType = new CustomEvent(EVENT_SECTIONS, {
          detail: updatedSections
        })
        document.dispatchEvent(event);

        // subscribers.forEach(callback => {
        //   try {
        //     callback(updatedSections);
        //   } catch (e) {
        //     console.error('Liquid Ajax Cart: Error during a call of a sections update subscriber');
        //     console.error(e);
        //   }
        // });
      }
    })
  })
}

// function subscribeToCartSectionsUpdate(callback: SectionsSubscriberType) {
//   subscribers.push(callback);
// }

export {cartSectionsInit/*, subscribeToCartSectionsUpdate*/};