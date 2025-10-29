// netlify/functions/get-country-list.js

// Use Node's built-in modules for more reliable connections
const https = require('https');
const urlModule = require('url');

// The specific WHO endpoint for the country list
const WHO_COUNTRY_LIST_URL = "https://ghoapi.azureedge.net/api/DIMENSION/COUNTRY/DimensionValues";

// Fallback country list for local testing when API is unavailable (contains common countries with WHO codes)
const FALLBACK_COUNTRIES = {
    value: [
        { Code: 'USA', Title: 'United States of America' },
        { Code: 'CAN', Title: 'Canada' },
        { Code: 'GBR', Title: 'United Kingdom' },
        { Code: 'AUS', Title: 'Australia' },
        { Code: 'DEU', Title: 'Germany' },
        { Code: 'FRA', Title: 'France' },
        { Code: 'JPN', Title: 'Japan' },
        { Code: 'CHN', Title: 'China' },
        { Code: 'IND', Title: 'India' },
        { Code: 'BRA', Title: 'Brazil' },
        { Code: 'MEX', Title: 'Mexico' },
        { Code: 'ITA', Title: 'Italy' },
        { Code: 'ESP', Title: 'Spain' },
        { Code: 'NLD', Title: 'Netherlands' },
        { Code: 'SWE', Title: 'Sweden' },
        { Code: 'NOR', Title: 'Norway' },
        { Code: 'DNK', Title: 'Denmark' },
        { Code: 'FIN', Title: 'Finland' },
        { Code: 'POL', Title: 'Poland' },
        { Code: 'BEL', Title: 'Belgium' },
        { Code: 'AUT', Title: 'Austria' },
        { Code: 'CHE', Title: 'Switzerland' },
        { Code: 'NZL', Title: 'New Zealand' },
        { Code: 'IRL', Title: 'Ireland' },
        { Code: 'PRT', Title: 'Portugal' },
        { Code: 'GRC', Title: 'Greece' },
        { Code: 'KOR', Title: 'Republic of Korea' },
        { Code: 'SGP', Title: 'Singapore' },
        { Code: 'ISR', Title: 'Israel' },
        { Code: 'ZAF', Title: 'South Africa' }
    ]
};

// Helper function to make HTTPS request with promise
function httpsRequest(urlString) {
    return new Promise((resolve, reject) => {
        const parsedUrl = urlModule.parse(urlString);
        
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.path,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Precious-Time-Calculator/1.0'
            }
        };
        
        const request = https.request(options, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    try {
                        resolve({
                            ok: true,
                            status: response.statusCode,
                            json: () => Promise.resolve(JSON.parse(data)),
                            text: () => Promise.resolve(data)
                        });
                    } catch (e) {
                        reject(new Error(`Failed to parse JSON: ${e.message}`));
                    }
                } else {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                }
            });
        });
        
        request.on('error', (error) => {
            // Preserve the error code for detection in catch block
            const networkError = new Error(`Network error (${error.code}): Cannot connect to WHO API.`);
            networkError.code = error.code;
            networkError.originalError = error;
            reject(networkError);
        });
        
        request.on('timeout', () => {
            request.destroy();
            const timeoutError = new Error('Connection timeout: Unable to reach WHO API.');
            timeoutError.code = 'ETIMEDOUT';
            reject(timeoutError);
        });
        
        request.setTimeout(30000); // Increase timeout to 30 seconds
        request.end(); // Important: actually send the request
    });
}

exports.handler = async function (event, context) {

    console.log("[Netlify Function] get-country-list: Request received.");

    try {
        console.log(`[Netlify Function] get-country-list: Calling WHO API: ${WHO_COUNTRY_LIST_URL}`);
        
        const response = await httpsRequest(WHO_COUNTRY_LIST_URL);

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
        console.error("[Netlify Function] get-country-list: Error message:", error.message);
        
        // Since the WHO API appears to be unavailable (both locally and on Netlify),
        // always use fallback data to ensure the app works
        // This is better than showing an error to users
        console.warn("[Netlify Function] get-country-list: WHO API unavailable. Using fallback country list.");
        console.warn("[Netlify Function] get-country-list: Error details - Code:", error.code, "Message:", error.message);
        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json", 
                "Access-Control-Allow-Origin": "*",
                "X-Fallback-Data": "true" // Flag to indicate this is fallback data
            },
            body: JSON.stringify(FALLBACK_COUNTRIES),
        };
    }
};
