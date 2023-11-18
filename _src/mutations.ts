import {
  addToQueues,
  EVENT_QUEUE_EMPTY_INTERNAL,
  EVENT_REQUEST_START_INTERNAL,
  REQUEST_ADD,
  REQUEST_CHANGE,
  REQUEST_CLEAR,
  REQUEST_GET,
  REQUEST_UPDATE
} from "./ajax-api";
import { EVENT_INIT } from "./const";
import { settings } from "./settings";
import { EventRequestStartType, MutationRequestType } from "./ts-types";

let pointer: number;
let needsRun = false;

function runAll() {
  const { mutations } = settings;
  if (!Array.isArray(mutations)) {
    console.error(`Liquid Ajax Cart: the "mutations" settings parameter must be an array`);
  }
  if (mutations.length === 0) return;
  needsRun = false;
  pointer = -1;
  runFunction();
}

function runFunction() {
  const { mutations } = settings;
  pointer++;
  if (pointer >= mutations.length) return;

  let requestsList: MutationRequestType[] = [];
  try {
    const response = mutations[pointer]();
    if (response) { 
      requestsList = response?.requests || []; 
    }
  } catch (e) {
    console.error(`Liquid Ajax Cart: Error in the "mutation" function with index ${pointer}`);
    console.error(e);
  }

  if (Array.isArray(requestsList)) {
    runRequests(requestsList);
    return;
  }

  runFunction();
}

function runRequests(requestsList: MutationRequestType[]) {
  const request = requestsList.shift();
  if (request) {

    if (request.type && [REQUEST_ADD, REQUEST_CHANGE, REQUEST_UPDATE, REQUEST_CLEAR, REQUEST_GET].includes(request.type)) {
      addToQueues({
        requestType: request.type,
        body: request.body,
        options: {
          info: {
            initiator: "mutation"
          },
          important: true,
          lastCallback: (_) => {
            runRequests(requestsList)
          }
        }
      });
      return;
    }
    console.error(`Liquid Ajax Cart: wrong request type in the mutation with index ${pointer}`);
  }
  if (requestsList.length > 0) {
    runRequests(requestsList);
    return;
  }

  runFunction();
}

function init() {
  document.addEventListener(EVENT_INIT, runAll);
  document.addEventListener(EVENT_QUEUE_EMPTY_INTERNAL, () => {
    if (!needsRun) return;
    runAll();
  });
  document.addEventListener(EVENT_REQUEST_START_INTERNAL, (event: EventRequestStartType) => {
    const { requestState } = event.detail;
    if (requestState.info.initiator !== "mutation") needsRun = true;
  });
}

export {
  init as cartMutationsInit,
  runAll as cartMutationsRun
};