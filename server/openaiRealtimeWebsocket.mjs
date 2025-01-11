const WebSocket = require('ws');
const  { RealtimeClient } = require('@openai/realtime-api-beta');

export function initialiseOpenaiRealtimeWebsocket(server, openaiApiKey) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', async (ws, request) => {
        if (!request.url) {
            console.log('No URL provided, closing connection.');
            ws.close();
            return;
        }

        console.log('A new client has connected via WebSocket');
        const url = new URL(request.url, `http://${request.headers.host}`);
        const pathname = url.pathname;

        if (pathname !== '/') {
            console.log(`Invalid pathname: "${pathname}"`);
            ws.close();
            return;
        }

        // Instantiate a new Real-time client
        console.log(`Connecting with key "${openaiApiKey.slice(0, 3)}..."`);
        const openaiClient = new RealtimeClient({ apiKey: openaiApiKey });

        // OpenAI Realtime API Event -> Browser Event
        openaiClient.realtime.on('server.*', (event) => {
            console.log(`Relaying "${event.type}" to Client`);
            ws.send(JSON.stringify(event));
        });

        // Close the WebSocket when OpenAI client disconnects
        openaiClient.realtime.on('close', () => ws.close());

        // Message queue to handle events before OpenAI client connects
        const messageQueue = [];
        const messageHandler = (data) => {
            try {
                const event = JSON.parse(data);
                openaiClient.realtime.send(event.type, event);
            } catch (e) {
                console.error('Error parsing message:', e.message);
            }
        };

        // Handle incoming WebSocket messages
        ws.on('message', (data) => {
            if (!openaiClient.isConnected()) {
                messageQueue.push(data);
            } else {
                messageHandler(data);
            }
        });

        // Handle WebSocket close
        ws.on('close', () => openaiClient.disconnect());

        // Handle WebSocket errors
        ws.on('error', handleError);

        // Connect to OpenAI Realtime API
        try {
            console.log('Connecting to OpenAI...');
            await openaiClient.connect();
        } catch (e) {
            console.log(`Error connecting to OpenAI: ${e.message}`);
            ws.close();
            return;
        }
        
        console.log('Connected to OpenAI successfully!');

        // Process any queued messages once OpenAI client is connected
        while (messageQueue.length) {
            messageHandler(messageQueue.shift());
        }
    });

    console.log('WebSocket server initialized');
};

// Helper Functions
function handleError(error) {
    console.error('An error occurred:', error.message);
}
