import {
  JSONValueType,
  UpdatedSectionType,
  EventRequestStartType,
  EventRequestEndType
} from './ts-types';

import {EVENT_REQUEST_END_INTERNAL, EVENT_REQUEST_START_INTERNAL, REQUEST_ADD} from './ajax-api';
import {DATA_ATTR_PREFIX} from "./const";


type StaticElementsListType = {
  [elementId: string]: Array<Element>
}

type ScrollAreasListType = {
  [scrollId: string]: Array<{ scroll: number, height: number }>
}

const DATA_ATTR_SECTION = `${DATA_ATTR_PREFIX}-section`;
const DATA_ATTR_STATIC_ELEMENT = `${DATA_ATTR_PREFIX}-static-element`;
const DATA_ATTR_SCROLL_AREA = `${DATA_ATTR_PREFIX}-section-scroll`;
const SHOPIFY_SECTION_PREFIX = 'shopify-section-';

function cartSectionsInit() {
  document.addEventListener(EVENT_REQUEST_START_INTERNAL, (event: EventRequestStartType) => {
    const {requestState} = event.detail;

    if (requestState.requestBody !== undefined) {
      const sectionNames: string[] = [];

      document.querySelectorAll(`[${DATA_ATTR_SECTION}]`).forEach(sectionNodeChild => {
        const sectionNode = sectionNodeChild.closest(`[id^="${SHOPIFY_SECTION_PREFIX}"]`);
        if (sectionNode) {
          const sectionId = sectionNode.id.replace(SHOPIFY_SECTION_PREFIX, '');
          if (sectionNames.indexOf(sectionId) === -1) {
            sectionNames.push(sectionId);
          }
        } else {
          console.error(`Liquid Ajax Cart: there is a ${DATA_ATTR_SECTION} element that is not inside a Shopify section. All the ${DATA_ATTR_SECTION} elements must be inside Shopify sections.`);
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
        if (
          (
            (typeof sectionsParam === 'string' || <JSONValueType>sectionsParam instanceof String) &&
            <string>sectionsParam !== ''
          ) ||
          (sectionsParam && Array.isArray(sectionsParam) && sectionsParam.length > 0)
        ) {
          requestingSections = `${(<string | string[]>sectionsParam).toString()},${requestingSections}`;
        }

        if (requestState.requestBody instanceof FormData || requestState.requestBody instanceof URLSearchParams) {
          requestState.requestBody.set('sections', requestingSections);
        } else {
          requestState.requestBody.sections = requestingSections;
        }
      }
    }
  });

  document.addEventListener(EVENT_REQUEST_END_INTERNAL, (event: EventRequestEndType) => {
    event.detail.sections = [];
    const {requestState} = event.detail;

    const parser = new DOMParser();
    const updatedSections: Array<UpdatedSectionType> = []; // for sections event

    if (requestState.responseData.body.sections || requestState.extraResponseData?.body?.sections) {
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
          sectionNode.querySelectorAll(` [${DATA_ATTR_SCROLL_AREA}] `).forEach(scrollAreaNode => {
            let scrollId = scrollAreaNode.getAttribute(DATA_ATTR_SCROLL_AREA).toString().trim();
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
          const staticElements = sectionNode.querySelectorAll(`[${DATA_ATTR_STATIC_ELEMENT}]`);
          if (staticElements) {
            staticElements.forEach(staticElement => {
              let staticElementId = staticElement.getAttribute(DATA_ATTR_STATIC_ELEMENT).toString().trim();
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
          const sectionParts = sectionNode.querySelectorAll(`[${DATA_ATTR_SECTION}]`);
          if (sectionParts) {
            const receivedDOM = parser.parseFromString(sections[sectionId], "text/html");

            // Remove all the loading="lazy" image attributes to avoid flickering on Safari
            receivedDOM.querySelectorAll('img[loading="lazy"]').forEach(image => {
              image.removeAttribute('loading');
            })

            // Restore static elements
            for (let staticElementId in staticElementsList) {
              receivedDOM.querySelectorAll(` [${DATA_ATTR_STATIC_ELEMENT}="${staticElementId.replace(noId, '')}"] `).forEach((staticElement, staticElementIndex) => {
                if (staticElementIndex + 1 <= staticElementsList[staticElementId].length) {
                  staticElement.before(staticElementsList[staticElementId][staticElementIndex]);
                  staticElement.parentElement.removeChild(staticElement);
                }
              })
            }

            // Replace old sections with new sections
            const receivedParts = receivedDOM.querySelectorAll(`[${DATA_ATTR_SECTION}]`);
            if (sectionParts.length !== receivedParts.length) {
              console.error(`Liquid Ajax Cart: the received HTML for the "${sectionId}" section has a different quantity of the "${DATA_ATTR_SECTION}" containers. The section will be updated completely.`);
              const receivedSection = receivedDOM.querySelector(`#${SHOPIFY_SECTION_PREFIX}${sectionId}`);
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
            sectionNode.querySelectorAll(` [${DATA_ATTR_SCROLL_AREA}="${scrollId.replace(noId, '')}"] `).forEach((scrollAreaNode, scrollAreaIndex) => {
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

    if (updatedSections.length > 0) {
      event.detail.sections = updatedSections;
    }
  })
}

export {cartSectionsInit};