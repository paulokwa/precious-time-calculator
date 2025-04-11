// --- API Configuration ---
// WHO GHO OData API endpoint details (Based on search results, WILL need refinement/verification)
// You MUST check the WHO API documentation for the correct indicator code and parameter names.
const API_BASE_URL = "https://ghoapi.azureedge.net/api/";
// Example Indicator for Life Expectancy at Birth - This is a GUESS, VERIFY THIS CODE:
const LIFE_EXPECTANCY_INDICATOR = "WHOSIS_000001";
// Example API parameter names - VERIFY THESE:
const SEX_PARAM_FILTER = "Dim1"; // e.g., $filter=Dim1 eq 'MLE'
const COUNTRY_PARAM_FILTER = "SpatialDim"; // e.g., $filter=SpatialDim eq 'CAN'
const LATEST_YEAR_SORT = "$orderby=TimeDim desc&$top=1"; // Gets the latest entry

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
 * Fetches Life Expectancy data from the WHO GHO OData API.
 * IMPORTANT: Requires verification of API endpoint, indicator code, and parameter names.
 * @param {string} countryCode - The country code (e.g., 'CAN', 'USA' - must match API expectations).
 * @param {string} sexCode - The sex code (e.g., 'MLE', 'FMLE' - must match API expectations).
 * @returns {Promise<number|null>} A Promise that resolves with the life expectancy number, or null if an error occurs.
 */
async function fetchLifeExpectancy(countryCode, sexCode) {
    // Construct the API URL using the configured constants and input parameters
    // This specific format needs verification from WHO API documentation!
    const apiUrl = `${API_BASE_URL}${LIFE_EXPECTANCY_INDICATOR}?$filter=${SEX_PARAM_FILTER} eq '${sexCode}' and ${COUNTRY_PARAM_FILTER} eq '${countryCode}'&${LATEST_YEAR_SORT}`;

    console.log("Attempting to fetch API:", apiUrl); // Log the URL for debugging - VERY USEFUL!

    try {
        const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json' } }); // Request JSON

        if (!response.ok) {
            // Handle HTTP errors (like 404 Not Found, 500 Server Error)
            console.error(`API Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text(); // Try to get more details from the response body
            console.error("API Response Text on Error:", errorText);
            return null; // Indicate failure clearly
        }

        // If response is OK, parse the JSON body
        const data = await response.json();
        console.log("API Response Data (raw):", data); // Log the full response - CRITICAL FOR DEBUGGING!

        // **CRITICAL STEP**: Parse the response to find the actual value.
        // The structure of 'data' depends entirely on the API. Inspect the console log above!
        // This is a GUESS assuming WHO OData returns { value: [ { NumericValue: 75.5, ... } ] }
        if (data && data.value && data.value.length > 0 && typeof data.value[0].NumericValue !== 'undefined') {
            const lifeExp = parseFloat(data.value[0].NumericValue);
            console.log("Parsed Life Expectancy:", lifeExp); // Log the extracted value
            return lifeExp; // Return the number
        } else {
            console.error("Could not find expected 'NumericValue' in API response structure:", data);
            return null; // Indicate data parsing failure
        }

    } catch (error) {
        // Handle network errors (e.g., no internet connection, DNS issues)
        console.error("Network or fetch error:", error);
        return null; // Indicate failure clearly
    }
}

/**
 * Main function to calculate and display the time breakdown.
 * This function is asynchronous because it calls the async fetchLifeExpectancy function.
 */
async function calculateTime() {
    // --- Stage 1: Setup ---
    // Show the loading message and move to the results step
    loadingDiv.style.display = 'block'; // Show "Fetching data..."
    resultsSummaryDiv.innerHTML = ''; // Clear previous results
    quoteDiv.textContent = ''; // Clear previous quote
    nextStep('step-results'); // Make the results section visible (showing the loading message)

    // --- Stage 2: Get User Inputs ---
    const currentAge = parseInt(ageInput.value);
    let selectedSex = null;
    // Find the checked radio button for sex
    sexInputs.forEach(input => {
        if (input.checked) {
            selectedSex = input.value; // This should be the value like 'MLE' or 'FMLE'
        }
    });
    const selectedCountryCode = countrySelect.value; // This should be the value like 'CAN', 'USA'
    const dailyWorryHours = parseFloat(worrySlider.value);
    const selectedCountryName = countrySelect.options[countrySelect.selectedIndex].text; // Get text for display

    // --- Stage 3: Validate Inputs ---
    if (isNaN(currentAge) || currentAge <= 0 || !selectedSex || !selectedCountryCode || isNaN(dailyWorryHours)) {
        resultsSummaryDiv.innerHTML = "<p style='color: red;'>Error: Please go back and ensure Age, Sex, Country, and Worry Time are all set correctly.</p>";
        loadingDiv.style.display = 'none'; // Hide loading message
        return; // Stop the function
    }

    // --- Stage 4: Call the API ---
    // Use await to pause execution until the API call finishes (or fails)
    const avgLifeExpectancy = await fetchLifeExpectancy(selectedCountryCode, selectedSex);

    // --- Stage 5: Process API Result & Calculate ---
    loadingDiv.style.display = 'none'; // Hide "Fetching data..." message now

    if (avgLifeExpectancy === null || avgLifeExpectancy <= 0) {
        // Handle cases where the API call failed or returned unusable data
        resultsSummaryDiv.innerHTML = `<p style='color: red;'>Error: Could not retrieve valid life expectancy data for your selection (${selectedCountryName}, ${selectedSex}). The API might be unavailable, the country/sex code might be invalid for the API, or data might be missing.</p><p>Please double-check the API details in the script or try again later.</p>`;
    } else {
        // API call was successful! Proceed with calculations.
        const yearsRemaining = Math.max(0, avgLifeExpectancy - currentAge);
        const totalDaysRemaining = yearsRemaining * 365.25; // Approx account for leap years
        const totalHoursRemaining = totalDaysRemaining * 24;
        const totalWorryHours = dailyWorryHours * totalDaysRemaining;
        const effectiveHoursRemaining = totalHoursRemaining - totalWorryHours;

        // Calculate worry time as a percentage of remaining waking time (approximate)
        const approxWakingHoursRemaining = yearsRemaining * 365.25 * (24 - 8); // Assuming ~8 hrs sleep/day
        const worryPercentage = approxWakingHoursRemaining > 0 ? (totalWorryHours / approxWakingHoursRemaining) * 100 : 0;

        // --- Stage 6: Display Results ---
        let resultsHTML = `
            <p>Based on API data, average life expectancy for ${selectedCountryName} (${selectedSex}) is around <strong>${avgLifeExpectancy.toFixed(1)} years</strong>.</p>
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
        resultsSummaryDiv.innerHTML = resultsHTML; // Display the calculated results

        // --- Stage 7: Display Quote ---
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteDiv.textContent = `"${quotes[randomIndex]}"`; // Display a random quote
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