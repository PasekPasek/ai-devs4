export const tools = [
  {
    type: 'function',
    function: {
      name: 'call_api',
      description:
        'Calls the railway API POST endpoint. Returns response body and headers. Handles 503 retries automatically.',
      parameters: {
        type: 'object',
        properties: {
          answer: {
            type: 'object',
            description: 'The value to put in the answer field of the request body'
          }
        },
        required: ['answer']
      }
    }
  }
];
