const dotenv = require('dotenv');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const http = require('http');
const initialiseOpenaiRealtimeWebsocket = require('./openaiRealtimeWebsocket.mjs');
// import dotenv from 'dotenv';
// import express from 'express';
// import axios from 'axios';
// import cors from 'cors';
// import http from 'http';
// import { initialiseOpenaiRealtimeWebsocket } from './openaiRealtimeWebsocket.js';

dotenv.config({ override: true });

const app = express();
app.use(cors());
const port = 3000;

// Create an HTTP server to attach the WebSocket server
const server = http.createServer(app);

// Get env variables
const heygenApiKey = process.env.VITE_HEYGEN_API_KEY;
const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
if (!heygenApiKey || !openaiApiKey) {
  console.error(
    `Environment variables "VITE_OPENAI_API_KEY" and "VITE_HEYGEN_API_KEY" are required.\n` +
    `Please set it in your .env file.`
  );
  process.exit(1);
}

// Initialize WebSocket server

initialiseOpenaiRealtimeWebsocket(server, openaiApiKey);

// API endpoint to get an access token from Heygen API
app.get('/api/get-access-token', async (_, res) => {
  try {
    if (!heygenApiKey) {
      throw new Error('API key is missing');
    }

    console.log('Sending request to Heygen API with API key:', heygenApiKey);

    const response = await axios.post('https://api.heygen.com/v1/streaming.create_token', null, {
      headers: { 'x-api-key': heygenApiKey },
    });

    console.log('Heygen API response status:', response.status);
    console.log('Heygen API response headers:', response.headers);

    // Check if the response content type is JSON
    if (
      response.headers['content-type'] &&
      response.headers['content-type'].includes('application/json')
    ) {
      const { data } = response.data;
      res.json({ token: data.token });
    } else {
      throw new Error('Unexpected response format from Heygen API');
    }
  } catch (error) {
    if (error.response) {
      console.error('Error response from Heygen API:', error.response.data);
      res.status(error.response.status).json({
        error: error.response.data || 'Unexpected error from Heygen API',
      });
    } else {
      console.error('Error making request to Heygen API:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
