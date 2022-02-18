# Queues

All Shopify Cart API requests doesn't get performed immediately but get added to queues.

```
Queue 1: [cartRequestAdd] [cartRequestChange]
Queue 2: [cartRequestAdd]
Queue 3: [cartRequestAdd]
```

If the first queue contains requests then they will be performed in order. When the requests from the first queue are finished — the queue gets removed, the second queue becomes first and the process gets repeated.

### If `newQueue` is `true`

If the `newQueue` property of a Shopify [Cart API request](/reference/requests/) options is `true` then a new queue will be created and the request will be added to the new queue. 

Use this option when your request doesn't have any relation to any other requests that might be in progress now. Usually these are requests that should get performed on a user action.

For example, you want to create a button that adds a product to cart and you want to make sure that its request will be performed after a possible current requests chain is finished:

```javascript
const button = document.querySelector('[data-my-button]');
if (button) {
  button.addEventListener('click', () => {
    cartRequestAdd({…}, { newQueue: true });
  })
}

// If a user clicks the button twice, then the requests order will look like this:
// Queue 1: [possible] [requests] [that] [are] [in] [progress]
// Queue 2: [cartRequestAdd]
// Queue 3: [cartRequestAdd]
```

### If `newQueue` is not `true`

If the `newQueue` property of request options is not defined or `false`, the request will be added to the end of the first queue and gets performed right after previous requests from the first queue are finished but before the second queue's requests are started. Use it when you want to run one more request after another (chain of requests) but before requests from next queues:

```javascript
const button = document.querySelector('[data-my-button]');
if (button) {
  button.addEventListener('click', () => {

    // cartRequestAdd will be performed in a new queue,
    // and we want to perform one more cartRequestChange request
    // after the cartRequestAdd is finished 
    // but before requests from next queues are started.
    cartRequestAdd({…}, { newQueue: true, lastComplete: ( requestState ) => {

      // If the "lastComplete" callback is called,
      // means the cartRequestAdd is just performed thus it is in the first queue.
      
      // Add cartRequestChange to the end of the first queue:
      cartRequestChange({…}, { newQueue: false });
    }});
  })
}

// If a user clicks the button twice, the queue will look like this:
// Queue 1: [possible] [requests] [that] [are] [in] [progress]
// Queue 2: [cartRequestAdd]
// Queue 3: [cartRequestAdd]

// When the possible request in progress are finished:
// Queue 1: [cartRequestAdd]
// Queue 2: [cartRequestAdd]

// When the button's first cartRequestAdd has just finished and the lastComplete callback is called, the cartRequestChange will be added to the first queue:
// Queue 1: [cartRequestAdd] [cartRequestChange]
// Queue 2: [cartRequestAdd]
```