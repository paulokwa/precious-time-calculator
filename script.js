// script.js - Updated to use Netlify Function Proxy

// --- API Configuration Constants (Mostly for reference now, used in Netlify Function) ---
// These details are used by the Netlify Function, not directly by this script anymore.
const API_BASE_URL = "https://ghoapi.azureedge.net/api/";
const LIFE_EXPECTANCY_INDICATOR = "WHOSIS_000001";
const SEX_PARAM_FILTER = "Dim1";
const COUNTRY_PARAM_FILTER = "SpatialDim"; // Must match what the Netlify function uses to call WHO
const LATEST_YEAR_SORT = "$orderby=TimeDim desc&$top=1";

// --- Data: Motivational Quotes ---
const quotes = [
    "Time is the most valuable thing a man can spend. - Theophrastus",
    "Lost time is never found again. - Benjamin Franklin",
    "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
    "The key is in not spending time, but in investing it. - Stephen R. Covey",
    "The future is something which everyone reaches at the rate of sixty minutes an hour, whatever he does, whoever he is. - C.S. Lewis",
    "Don’t watch the clock; do what it does. Keep going. - Sam Levenson"
    // Add more quotes if you like
];

// --- DOM Elements ---
// Select all the HTML elements we need to interact with
const ageInput = document.getElementById('age');
const sexInputs = document.querySelectorAll('input[name="sex"]'); // Gets both Male/Female radio buttons
const countrySelect = document.getElementById('country');
const worrySlider = document.getElementById('worry-hours');
const worryOutput = document.getElementById('worry-output');
const resultsSummaryDiv = document.getElementById('results-summary');
const quoteDiv = document.getElementById('motivational-quote');
const loadingDiv = document.getElementById('results-loading'); // The "Fetching data..." message div
const steps = document.querySelectorAll('.step'); // Gets all sections with class="step"

// --- Event Listeners ---
// Update the displayed worry hours when the slider changes
worrySlider.addEventListener('input', () => {
    worryOutput.textContent = `${worrySlider.value} hour${worrySlider.value == 1 ? '' : 's'}`;
});

// --- Functions ---

/**
 * Hides all steps and shows the step with the specified ID.
 * @param {string} nextStepId - The ID of the HTML section element to show.
 */
function nextStep(nextStepId) {
    steps.forEach(step => step.classList.remove('active')); // Hide all
    const nextStepElement = document.getElementById(nextStepId);
    if (nextStepElement) {
        nextStepElement.classList.add('active'); // Show the target one
    } else {
        console.error("Error: Step not found with ID:", nextStepId);
    }
}

/**
 * Fetches Life Expectancy data VIA THE NETLIFY PROXY FUNCTION.
 * @param {string} countryCode - The country code (e.g., 'CAN', 'USA').
 * @param {string} sexCode - The sex code (e.g., 'SEX_MLE', 'SEX_FMLE').
 * @returns {Promise<number|null>} A Promise that resolves with the life expectancy number, or null if an error occurs.
 */
async function fetchLifeExpectancy(countryCode, sexCode) {
    // Construct the URL to call our Netlify Function, passing parameters in the query string
    // This replaces the direct call to the WHO API
    const apiUrl = `/.netlify/functions/get-life-expectancy?country=${encodeURIComponent(countryCode)}&sex=${encodeURIComponent(sexCode)}`;

    console.log("Attempting to fetch Netlify Function:", apiUrl); // Updated log message

    try {
        // Fetch from our Netlify function endpoint
        const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });

        if (!response.ok) {
            // Handle errors returned FROM OUR NETLIFY FUNCTION
            console.error(`Netlify Function Error: ${response.status} ${response.statusText}`);
            let errorData = { error: `Proxy function returned status ${response.status}` }; // Default error
            try {
                 errorData = await response.json(); // Try to parse error details from our function's body
                 console.error("Netlify Function Response Body on Error:", errorData);
            } catch (parseError) {
                 console.error("Could not parse error response body from Netlify function.");
            }
            // Display error message based on function's response if possible
            resultsSummaryDiv.innerHTML = `<p style='color: red;'>Error: ${errorData.error || 'Failed to get data via proxy function.'} ${errorData.details ? '(' + errorData.details + ')' : ''}</p>`;
            return null; // Indicate failure clearly
        }

        // If response is OK, parse the JSON body (this should be the data passed through from WHO)
        const data = await response.json();
        console.log("Proxy Function Response Data (raw):", data); // Log the full response - CRITICAL FOR DEBUGGING!

        // **CRITICAL STEP**: Parse the response FROM WHO (passed through the proxy)
        // Check if 'value' array exists and has entries
        if (data && data.value && data.value.length > 0) {
            // Check if the first entry has the 'NumericValue' property
            if (typeof data.value[0].NumericValue !== 'undefined') {
                const lifeExp = parseFloat(data.value[0].NumericValue);
                console.log("Parsed Life Expectancy:", lifeExp); // Log the extracted value
                return lifeExp; // Return the number
            } else {
                console.error("Proxy returned data, but missing 'NumericValue' property:", data.value[0]);
                resultsSummaryDiv.innerHTML = `<p style='color: red;'>Error: Received data from proxy, but format was unexpected (Missing NumericValue).</p>`;
                return null; // Indicate unexpected data structure
            }
        } else {
            // Handle the case where 'value' array is empty or missing in the WHO data
            if (data && data.value && data.value.length === 0) {
                console.warn(`Proxy returned data, but WHO 'value' array is empty for ${countryCode}/${sexCode}. No matching data found.`);
                resultsSummaryDiv.innerHTML = `<p style='color: orange;'>Warning: No specific life expectancy data found for ${countryCode}/${sexCode} via WHO API.</p>`;
            } else {
                console.error("Could not find expected 'value' array in proxy response structure or it was empty:", data);
                resultsSummaryDiv.innerHTML = `<p style='color: red;'>Error: Received unexpected data structure from proxy.</p>`;
            }
            return null; // Indicate no data found or parsing failure
        }

    } catch (error) {
        // Handle network errors contacting OUR NETLIFY FUNCTION
        console.error("Network error fetching Netlify function:", error);
        resultsSummaryDiv.innerHTML = `<p style='color: red;'>Error: Could not connect to the proxy function. Check network or Netlify Dev status.</p>`;
        return null; // Indicate failure clearly
    }
}


/**
 * Main function to calculate and display the time breakdown.
 * This function is asynchronous because it calls the async fetchLifeExpectancy function.
 */
async function calculateTime() {
    // --- Stage 1: Setup ---
    loadingDiv.style.display = 'block';
    resultsSummaryDiv.innerHTML = '';
    quoteDiv.textContent = '';
    nextStep('step-results');

    // --- Stage 2: Get User Inputs ---
    const currentAge = parseInt(ageInput.value);
    let selectedSex = null; // This will now hold 'SEX_MLE' or 'SEX_FMLE'
    sexInputs.forEach(input => {
        if (input.checked) {
            selectedSex = input.value;
        }
    });
    const selectedCountryCode = countrySelect.value; // e.g., 'CAN'
    const dailyWorryHours = parseFloat(worrySlider.value);
    const selectedCountryName = countrySelect.options[countrySelect.selectedIndex].text; // Get text for display

    // --- Stage 3: Validate Inputs ---
    if (isNaN(currentAge) || currentAge <= 0 || !selectedSex || !selectedCountryCode || isNaN(dailyWorryHours)) {
        resultsSummaryDiv.innerHTML = "<p style='color: red;'>Error: Please go back and ensure Age, Sex, Country, and Worry Time are all set correctly.</p>";
        loadingDiv.style.display = 'none';
        return;
    }

    // --- Stage 4: Call the API (via Netlify Function) ---
    // Use await to pause execution until the API call finishes (or fails)
    const avgLifeExpectancy = await fetchLifeExpectancy(selectedCountryCode, selectedSex);

    // --- Stage 5: Process API Result & Calculate ---
    loadingDiv.style.display = 'none'; // Hide "Fetching data..." message now

    // Check if fetchLifeExpectancy already displayed an error message
    if (resultsSummaryDiv.innerHTML.includes("Error:")) {
         // Error was already handled and displayed within fetchLifeExpectancy
         return;
    }

    // Only proceed if avgLifeExpectancy has a valid number
    if (avgLifeExpectancy === null || avgLifeExpectancy <= 0) {
        // This case might be redundant if fetchLifeExpectancy handles all errors,
        // but kept as a fallback. The specific error/warning should have been
        // displayed by fetchLifeExpectancy itself (e.g., value: [] case).
        if (!resultsSummaryDiv.innerHTML) { // Avoid overwriting specific warnings
             resultsSummaryDiv.innerHTML = `<p style='color: red;'>Error: An unknown issue occurred while fetching or processing life expectancy data.</p>`;
        }
    } else {
        // Calculation successful! Proceed with calculations.
        const yearsRemaining = Math.max(0, avgLifeExpectancy - currentAge);
        const totalDaysRemaining = yearsRemaining * 365.25;
        const totalHoursRemaining = totalDaysRemaining * 24;
        const totalWorryHours = dailyWorryHours * totalDaysRemaining;
        const effectiveHoursRemaining = totalHoursRemaining - totalWorryHours;
        const approxWakingHoursRemaining = yearsRemaining * 365.25 * (24 - 8);
        const worryPercentage = approxWakingHoursRemaining > 0 ? (totalWorryHours / approxWakingHoursRemaining) * 100 : 0;

        // --- Stage 6: Display Results ---
        // Determine display text for sex code
        let sexDisplay = selectedSex; // Default
        if (selectedSex === 'SEX_MLE') sexDisplay = 'Male';
        if (selectedSex === 'SEX_FMLE') sexDisplay = 'Female';

        let resultsHTML = `
            <p>Based on API data, average life expectancy for ${selectedCountryName} (${sexDisplay}) is around <strong>${avgLifeExpectancy.toFixed(1)} years</strong>.</p>
            <p>At age ${currentAge}, you have approximately <strong>${yearsRemaining.toFixed(1)} years</strong> remaining based on this average.</p>
        `;
        if (yearsRemaining > 0) {
            resultsHTML += `
                <p>Spending <strong>${dailyWorryHours} hours</strong> worrying daily could accumulate to roughly <strong>${totalWorryHours.toLocaleString(undefined, { maximumFractionDigits: 0 })} hours</strong> over that remaining time.</p>
                <p>That worry time represents approximately <strong>${worryPercentage.toFixed(1)}%</strong> of your potential remaining <em>waking</em> hours.</p>
                <p>Your potential effective hours remaining (total minus worry time) are estimated at: <strong style="font-size: 1.1em;">${effectiveHoursRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></p>
            `;
        } else {
            resultsHTML += `<p>According to averages, you've reached or surpassed the average life expectancy for your selection. Every day is a bonus!</p>`;
        }
        resultsSummaryDiv.innerHTML = resultsHTML;

        // --- Stage 7: Display Quote ---
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteDiv.textContent = `"${quotes[randomIndex]}"`;
    }
}

// --- Initial Setup ---
// This runs when the HTML page has fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Ensure only the first step ('step-age') is visible when the page loads
    steps.forEach((step, index) => {
        step.classList.toggle('active', index === 0);
    });
    // Set the initial text for the worry slider output
    worryOutput.textContent = `${worrySlider.value} hour${worrySlider.value == 1 ? '' : 's'}`;
});