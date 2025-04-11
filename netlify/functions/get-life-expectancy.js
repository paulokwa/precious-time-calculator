// netlify/functions/get-life-expectancy.js
// Updated to include console.log for debugging the fetch URL

// Import the node-fetch library we installed
const fetch = require('node-fetch');

// WHO GHO OData API Configuration (Keep these consistent with your findings)
const API_BASE_URL = "https://ghoapi.azureedge.net/api/";
const LIFE_EXPECTANCY_INDICATOR = "WHOSIS_000001"; // Verified Indicator
const SEX_PARAM_FILTER = "Dim1"; // Verified Sex Dimension
const COUNTRY_PARAM_FILTER = "SpatialDim"; // Verified Country Dimension
const LATEST_YEAR_SORT = "$orderby=TimeDim desc&$top=1"; // Gets the latest entry

// Define the main function handler for Netlify
exports.handler = async function (event, context) {
    // 1. Get parameters from the frontend request URL
    const countryCode = event.queryStringParameters.country;
    const sexCode = event.queryStringParameters.sex;

    // 2. Basic input validation
    if (!countryCode || !sexCode) {
        return {
            statusCode: 400, // Bad Request
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, // CORS for local testing
            body: JSON.stringify({ error: "Missing required query parameters: country, sex" }),
        };
    }

    // 3. Construct the target WHO API URL
    const whoApiUrl = `${API_BASE_URL}${LIFE_EXPECTANCY_INDICATOR}?$filter=${SEX_PARAM_FILTER} eq '${sexCode}' and ${COUNTRY_PARAM_FILTER} eq '${countryCode}'&${LATEST_YEAR_SORT}`;

    console.log(`[Netlify Function] Calling WHO API (constructed URL): ${whoApiUrl}`); // Log constructed URL

    try {
        // ---- ADDED THIS LINE FOR DEBUGGING ----
        // Log the URL right before it's passed to node-fetch
        console.log("[Netlify Function] URL passed to node-fetch:", whoApiUrl);
        // ------------------------------------

        // 4. Make the request to the WHO API from the serverless function
        const whoResponse = await fetch(whoApiUrl, { // This fetch needs an absolute URL
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        // 5. Check if the request to WHO was successful
        if (!whoResponse.ok) {
            console.error(`[Netlify Function] WHO API Error: ${whoResponse.status} ${whoResponse.statusText}`);
            const errorText = await whoResponse.text();
            console.error(`[Netlify Function] WHO API Response Text: ${errorText}`);
            return {
                statusCode: whoResponse.status, // Pass through status code
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, // CORS
                body: JSON.stringify({ error: `Failed to fetch data from WHO API. Status: ${whoResponse.status}`, details: errorText }),
            };
        }

        // 6. Parse the JSON data from WHO
        const whoData = await whoResponse.json();
        console.log("[Netlify Function] Received data from WHO API.");

        // 7. Send the successful response back to the frontend
        return {
            statusCode: 200, // OK
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, // CORS
            body: JSON.stringify(whoData), // Pass the WHO data directly
        };

    } catch (error) {
        // 8. Handle network errors or other issues during the fetch
        console.error("[Netlify Function] Error fetching from WHO API:", error);
        // Pass the specific error message back for better diagnosis
        return {
            statusCode: 500, // Internal Server Error
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, // CORS
            body: JSON.stringify({ error: "Internal server error while contacting WHO API.", details: error.message }), // Include error.message
        };
    }
};