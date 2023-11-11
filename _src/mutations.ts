import {
  cartRequestAdd, cartRequestChange, cartRequestClear, cartRequestGet, cartRequestUpdate,
  EVENT_QUEUE_END_INTERNAL,
  EVENT_REQUEST_START_INTERNAL,
  REQUEST_ADD,
  REQUEST_CHANGE, REQUEST_CLEAR, REQUEST_GET, REQUEST_UPDATE
} from "./ajax-api";
import {EVENT_INIT} from "./const";
import {settings} from "./settings";
import {CartRequestOptionsType, EventRequestStartType, MutationRequestType} from "./ts-types";

let pointer: number;
let repeats: number;
let needsRun = true;
const REPEATS_LIMIT_DEFAULT = 5;

function runAll() {
  console.log("run ALl");
  const {mutations} = settings;
  if (!Array.isArray(mutations)) {
    console.error(`Liquid Ajax Cart: the "mutations" settings parameter must be an array`);
  }
  if (mutations.length === 0) return;
  if (!needsRun) return;
  needsRun = false;
  pointer = 0;
  repeats = 0;
  runFunction();
}

function runFunction() {
  const {mutations} = settings;
  if (pointer >= mutations.length) return;

  try {
    const command = mutations[pointer]();
    if (command && command.requests) {
      repeats++;
      const maxRepeats = command.maxRepeats || REPEATS_LIMIT_DEFAULT;
      if (repeats <= maxRepeats) {
        runRequests(command.requests, command.repeat);
        return;
      }
      console.error(`Liquid Ajax Cart: Repeats limit is reached for the "mutation" function with index ${pointer}`);
    }
  } catch (e) {
    console.error(`Liquid Ajax Cart: Error in the "mutation" function with index ${pointer}`);
    console.error(e);
  }
  pointer++;
  repeats = 0;
  runFunction();
}

function runRequests(requestsList: MutationRequestType[], repeat: boolean) {
  const request = requestsList.shift();
  if (request) {

    const requestOptions: CartRequestOptionsType = {
      info: {
        mutation: true
      },
      important: true,
      lastCallback: (_) => {runRequests(requestsList, repeat)}
    }

    switch (request.type) {
      case REQUEST_ADD:
        cartRequestAdd(request.body, requestOptions);
        return;

      case REQUEST_CHANGE:
        cartRequestChange(request.body, requestOptions);
        return;

      case REQUEST_UPDATE:
        cartRequestUpdate(request.body, requestOptions);
        return;

      case REQUEST_CLEAR:
        cartRequestClear(request.body, requestOptions);
        return;

      case REQUEST_GET:
        cartRequestGet(requestOptions);
        return;

      default:
        console.error(`Liquid Ajax Cart: wrong request type in the mutation with index ${pointer}`);
    }
  }
  if (requestsList.length > 0) {
    runRequests(requestsList, repeat);
    return;
  }

  if (!repeat) {
    pointer++;
  }
  runFunction();
}

function init() {
  document.addEventListener(EVENT_INIT, runAll);
  document.addEventListener(EVENT_QUEUE_END_INTERNAL, runAll);
  document.addEventListener(EVENT_REQUEST_START_INTERNAL, (event: EventRequestStartType) => {
    const {requestState} = event.detail;
    if (!requestState.info.mutation) needsRun = true;
  });
}

export {
  init as cartMutationsInit
};