/**
 * Script Description:
 *
 * This script processes messages based on changes in payload or intervals.
 * It checks if the current message's payload differs from the last processed one, 
 * taking into account an optional deadband for numeric values. Messages can be 
 * sent immediately if they differ, or after a specified interval even if unchanged. 
 * The context is resettable via a `reset` flag in the incoming message.
 *
 * Parameters:
 * - msg: An object representing the current message with possible properties:
 *   - payload: The data content of the message (any type).
 *   - deadband: A numeric value specifying the allowable range for considering 
 *               two consecutive numeric payloads as equal. Defaults to 0.1 if not provided.
 *   - reset: A boolean flag indicating whether to reset the context state.
 * - context: An object maintaining state between message invocations, with possible properties:
 *   - lastPayload: The payload of the last processed message (any type).
 *   - counter: A numeric value counting messages since the last different or interval-specified message.
 *   - interval: An optional numeric value specifying how many messages to allow before sending 
 *               even if unchanged. Defaults to 10 if not provided.
 *   - deadband: An optional numeric value similar to msg.deadband, used for context configuration.
 *
 */

// Configuration: Use node-configured interval or default to 60
const interval = msg.interval || context.interval || 10;
// Configuration: Use node-configured deadband or default to 0
const deadband = msg.deadband !== undefined ? msg.deadband :
                context.deadband !== undefined ? context.deadband : 0.1;

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
        isDifferent = Math.abs(msg.payload - context.lastPayload) > deadband;
    } else {
        // For non-numeric payloads, use strict inequality
        isDifferent = msg.payload !== context.lastPayload;
    }
}

// Update context based on message processing result
context.counter += 1;

// If payload is different or interval reached, send the message and reset counter
if (isDifferent || context.counter >= interval) {
    context.lastPayload = msg.payload; // Update last processed payload
    context.counter = 0; // Reset message count

    return msg; // Return message to indicate it should be sent
}

// If no conditions are met, do not send the message
return null;