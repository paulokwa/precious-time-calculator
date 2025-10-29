// netlify/functions/get-life-expectancy.js
// Updated to include console.log for debugging the fetch URL

// Use Node's built-in modules for more reliable connections
const https = require('https');
const urlModule = require('url');

// WHO GHO OData API Configuration (Keep these consistent with your findings)
const API_BASE_URL = "https://ghoapi.azureedge.net/api/";
const LIFE_EXPECTANCY_INDICATOR = "WHOSIS_000001"; // Verified Indicator
const SEX_PARAM_FILTER = "Dim1"; // Verified Sex Dimension
const COUNTRY_PARAM_FILTER = "SpatialDim"; // Verified Country Dimension
const LATEST_YEAR_SORT = "$orderby=TimeDim desc&$top=1"; // Gets the latest entry

// Fallback life expectancy data (approximate values) for when WHO API is unavailable
// Format: { countryCode: { SEX_MLE: maleLifeExpectancy, SEX_FMLE: femaleLifeExpectancy } }
const FALLBACK_LIFE_EXPECTANCY = {
    'USA': { SEX_MLE: 73.5, SEX_FMLE: 79.3 },
    'CAN': { SEX_MLE: 79.9, SEX_FMLE: 84.0 },
    'GBR': { SEX_MLE: 79.0, SEX_FMLE: 82.9 },
    'AUS': { SEX_MLE: 81.2, SEX_FMLE: 85.3 },
    'DEU': { SEX_MLE: 78.9, SEX_FMLE: 83.6 },
    'FRA': { SEX_MLE: 80.0, SEX_FMLE: 85.7 },
    'JPN': { SEX_MLE: 81.9, SEX_FMLE: 87.9 },
    'CHN': { SEX_MLE: 75.4, SEX_FMLE: 80.5 },
    'IND': { SEX_MLE: 68.4, SEX_FMLE: 70.7 },
    'BRA': { SEX_MLE: 72.8, SEX_FMLE: 79.1 },
    'MEX': { SEX_MLE: 72.1, SEX_FMLE: 78.9 },
    'ITA': { SEX_MLE: 81.9, SEX_FMLE: 85.6 },
    'ESP': { SEX_MLE: 80.9, SEX_FMLE: 86.2 },
    'NLD': { SEX_MLE: 80.7, SEX_FMLE: 83.6 },
    'SWE': { SEX_MLE: 81.7, SEX_FMLE: 84.9 },
    'NOR': { SEX_MLE: 81.6, SEX_FMLE: 84.7 },
    'DNK': { SEX_MLE: 80.3, SEX_FMLE: 83.7 },
    'FIN': { SEX_MLE: 79.8, SEX_FMLE: 84.9 },
    'POL': { SEX_MLE: 75.7, SEX_FMLE: 81.8 },
    'BEL': { SEX_MLE: 80.2, SEX_FMLE: 84.3 },
    'AUT': { SEX_MLE: 80.1, SEX_FMLE: 84.2 },
    'CHE': { SEX_MLE: 82.2, SEX_FMLE: 85.8 },
    'NZL': { SEX_MLE: 80.9, SEX_FMLE: 84.4 },
    'IRL': { SEX_MLE: 81.4, SEX_FMLE: 84.4 },
    'PRT': { SEX_MLE: 79.5, SEX_FMLE: 84.9 },
    'GRC': { SEX_MLE: 79.4, SEX_FMLE: 84.6 },
    'KOR': { SEX_MLE: 80.9, SEX_FMLE: 86.7 },
    'SGP': { SEX_MLE: 81.5, SEX_FMLE: 85.9 },
    'ISR': { SEX_MLE: 80.6, SEX_FMLE: 84.6 },
    'ZAF': { SEX_MLE: 62.7, SEX_FMLE: 68.3 }
};

// Helper function to create WHO API-compatible response with fallback data
function createFallbackResponse(countryCode, sexCode) {
    const countryData = FALLBACK_LIFE_EXPECTANCY[countryCode];
    if (!countryData) {
        return null; // No fallback data for this country
    }
    
    const lifeExpectancy = countryData[sexCode];
    if (lifeExpectancy === undefined) {
        return null; // Invalid sex code
    }
    
    // Return in WHO API format: { value: [{ NumericValue: lifeExpectancy }] }
    return {
        value: [{
            NumericValue: lifeExpectancy,
            SpatialDim: countryCode,
            Dim1: sexCode,
            TimeDim: '2022' // Approximate year
        }]
    };
}

// Helper function to make HTTPS request with timeout and better error handling
function httpsRequest(urlString, timeout = 30000) {
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
            const networkError = new Error(`Network error (${error.code}): Cannot connect to WHO API.`);
            networkError.code = error.code;
            reject(networkError);
        });
        
        request.on('timeout', () => {
            request.destroy();
            const timeoutError = new Error('Connection timeout: Unable to reach WHO API.');
            timeoutError.code = 'ETIMEDOUT';
            reject(timeoutError);
        });
        
        request.setTimeout(timeout);
        request.end();
    });
}

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
        // Log the URL right before it's passed to https request
        console.log("[Netlify Function] URL passed to https request:", whoApiUrl);

        // 4. Make the request to the WHO API from the serverless function
        // Use a 10 second timeout to fail faster if API is unavailable
        const whoResponse = await httpsRequest(whoApiUrl, 10000);

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
        console.error("[Netlify Function] Error code:", error.code, "Message:", error.message);
        
        // Check if this is a network connectivity issue
        const isNetworkError = error.code === 'ETIMEDOUT' || 
                               error.code === 'ECONNRESET' || 
                               error.code === 'ECONNREFUSED' ||
                               error.code === 'ENOTFOUND' ||
                               error.message.includes('timeout') ||
                               error.message.includes('Cannot connect');
        
        // If it's a network error, try to use fallback data
        if (isNetworkError) {
            console.warn("[Netlify Function] WHO API unavailable. Attempting to use fallback data.");
            const fallbackData = createFallbackResponse(countryCode, sexCode);
            
            if (fallbackData) {
                console.warn("[Netlify Function] Using fallback life expectancy data for", countryCode, sexCode);
                return {
                    statusCode: 200,
                    headers: { 
                        "Content-Type": "application/json", 
                        "Access-Control-Allow-Origin": "*",
                        "X-Fallback-Data": "true" // Flag to indicate this is fallback data
                    },
                    body: JSON.stringify(fallbackData),
                };
            } else {
                console.warn("[Netlify Function] No fallback data available for", countryCode, sexCode);
                return {
                    statusCode: 500,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ 
                        error: "Unable to connect to WHO API and no fallback data available for this country.",
                        details: error.message,
                        code: error.code || 'UNKNOWN'
                    }),
                };
            }
        }
        
        // For non-network errors, return error response
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ 
                error: "Unable to fetch life expectancy data from WHO API.",
                details: error.message,
                code: error.code || 'UNKNOWN'
            }),
        };
    }
};