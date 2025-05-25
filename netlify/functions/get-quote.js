const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const apiUrl = 'https://zenquotes.io/api/random';

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: 'Failed to fetch quote from external API' }),
            };
        }

        const data = await response.json();

        // The ZenQuotes API returns an array with one quote object for the /random endpoint
        if (data && data.length > 0) {
            return {
                statusCode: 200,
                body: JSON.stringify(data[0]), // Return the first object in the array
            };
        } else {
             return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Received empty data from quote API' }),
            };
        }

    } catch (error) {
        console.error('Error fetching quote via proxy:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Network error or internal server error' }),
        };
    }
}; 