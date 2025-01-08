const dotenv = require('dotenv');
const express = require('express');
const axios = require('axios');
const cors = require('cors');

dotenv.config({ override: true });
const app = express();
app.use(cors());
const port = 3000;

app.get('/api/get-access-token', async (_, res) => {
  try {
    const apiKey = process.env.VITE_HEYGEN_API_KEY;

    if (!apiKey) {
      throw new Error('API key is missing');
    }

    console.log('Sending request to Heygen API with API key:', apiKey);

    const response = await axios.post('https://api.heygen.com/v1/streaming.create_token', null, {
      headers: { 'x-api-key': apiKey },
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
