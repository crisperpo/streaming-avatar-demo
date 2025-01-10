const WebSocket = require('ws');

function initialiseWebsocketServer(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('A new client has connected via Websocket');

        // Handle opening a connection
        ws.on('open', (ws) => handleOpenConnection(ws));
        // Handle incoming messages from the client
        ws.on('message', (message) => handleIncomingMessage(ws, message));
        // Handle client disconnection
        ws.on('close', handleCloseConnection);
        // Handle errors
        ws.on("error", handleError);
    });

    console.log('WebSocket server initialized');
};

async function handleOpenConnection(ws) {
    // Send a welcome message
    ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server!' }));
}

function handleIncomingMessage(ws, message) {
    try {
        const parsedMessage = JSON.parse(message);
        console.log('Received message from client:', parsedMessage);

        // Respond to the client
        ws.send(JSON.stringify({ message: `You sent: ${parsedMessage.message}` }));
    } catch (error) {
        console.error('Error processing message:', error.message);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
}

function handleCloseConnection() {
    console.log('OpenAI Realtime websocket client disconnected');
}

function handleError(error) {
    console.error('An error occurred:', error.message);
}

module.exports = initialiseWebsocketServer;
