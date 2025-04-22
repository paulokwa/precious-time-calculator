// netlify/functions/get-country-list.js

const fetch = require('node-fetch');

// The specific WHO endpoint for the country list
const WHO_COUNTRY_LIST_URL = "https://ghoapi.azureedge.net/api/DIMENSION/COUNTRY/DimensionValues";

exports.handler = async function (event, context) {

    console.log("[Netlify Function] get-country-list: Request received.");

    try {
        console.log(`[Netlify Function] get-country-list: Calling WHO API: ${WHO_COUNTRY_LIST_URL}`);
        const response = await fetch(WHO_COUNTRY_LIST_URL, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            // Handle errors from WHO API
            console.error(`[Netlify Function] get-country-list: WHO API Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
             console.error(`[Netlify Function] get-country-list: WHO API Response: ${errorText}`);
            return {
                statusCode: response.status,
                 headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: `Failed to fetch country list from WHO API. Status: ${response.status}`, details: errorText }),
            };
        }

        // Parse data from WHO
        const countryData = await response.json();
        console.log("[Netlify Function] get-country-list: Received country data from WHO API.");

        // Send successful response back to frontend
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, // CORS for local testing
            body: JSON.stringify(countryData), // Pass the whole list data back
        };

    } catch (error) {
        // Handle network or other errors during fetch
        console.error("[Netlify Function] get-country-list: Error fetching from WHO API:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Internal server error while fetching country list.", details: error.message }),
        };
    }
};