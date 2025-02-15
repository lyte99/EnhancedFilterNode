// Configuration: Use node-configured interval or default to 60
const interval = msg.interval || context.interval || 10;

// Configuration: Use node-configured deadband or default to 0
const deadband = msg.deadband !== undefined ? msg.deadband
              : context.deadband !== undefined ? context.deadband
              : 0.1;

// Reset mechanism: If msg.reset is true, reset the context
if (msg.reset) {
    context.lastPayload = undefined;
    context.counter = 0;
    node.log('Context reset');
    return null; // Do not pass the reset message further
}

// Initialize context variables if not already set
if (context.lastPayload === undefined) {
    context.lastPayload = undefined; // Explicitly undefined for clarity
}

if (context.counter === undefined) {
    context.counter = 0;
}

// Determine if this is the first message
const isFirstMessage = (context.lastPayload === undefined);

// Prepare payloads for comparison
const payloadToCompare = (typeof msg.payload === 'object') ? JSON.stringify(msg.payload) : msg.payload;
const lastPayload = (typeof context.lastPayload === 'object') ? JSON.stringify(context.lastPayload) : context.lastPayload;

// Initialize difference flag
let isDifferent = isFirstMessage;

// Handle numeric payloads with deadband
if (!isFirstMessage) {
    if (typeof msg.payload === 'number' && typeof context.lastPayload === 'number') {
        // If deadband is greater than 0, apply deadband comparison
        if (deadband > 0) {
            const difference = Math.abs(msg.payload - context.lastPayload);
            isDifferent = difference > deadband;
        } else {
            // No deadband, exact match comparison
            isDifferent = (msg.payload !== context.lastPayload);
        }
    } else {
        // For non-numeric types, use exact match
        isDifferent = (payloadToCompare !== lastPayload);
    }
}

// Increment the counter
context.counter += 1;

// Logging for debugging (optional)
node.log(`Payload: ${msg.payload}, Is Different: ${isDifferent}, Counter: ${context.counter}, Deadband: ${deadband}`);

// Determine if the message should be sent
if (isDifferent) {
    // Send the message because it's different
    context.lastPayload = msg.payload; // Update the last payload
    context.counter = 0; // Reset the counter
    return msg; // Pass the message through
} else if (context.counter >= interval) {
    // Allow the message through at the specified interval
    context.counter = 0; // Reset the counter
    return msg; // Pass the message through
} else {
    // Do not pass the message
    return null;
}
