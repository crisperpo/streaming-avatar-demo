export async function fetchAccessToken() {
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/get-access-token`;
    return fetch(apiUrl, { method: 'GET' })
        .then((response) => {
            if (response.ok) {
                // Check if the response content-type is JSON
                if (response.headers.get('content-type')?.includes('application/json')) {
                    return response.json(); // Parse the response as JSON
                } else {
                    return response.text().then((text) => {
                        throw new Error(`Unexpected response format: ${text}`);
                    });
                }
            } else {
                throw new Error(`Failed to fetch token: ${response.status} ${response.statusText}`);
            }
        })
        .then((data) => {
            console.log('Token:', data.token);
            return data.token; // Return the token
        })
        .catch((error) => {
            console.error('Error fetching access token:', error.message);
            throw error; // Re-throw the error for further handling
        });
}
