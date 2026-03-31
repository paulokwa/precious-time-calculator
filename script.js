// script.js - Updated to use Netlify Function Proxy & Display Days/Hours

// --- API Configuration Constants (Mostly for reference now, used in Netlify Function) ---
const API_BASE_URL = "https://ghoapi.azureedge.net/api/";
const LIFE_EXPECTANCY_INDICATOR = "WHOSIS_000001";
const SEX_PARAM_FILTER = "Dim1";
const COUNTRY_PARAM_FILTER = "SpatialDim"; // Must match what the Netlify function uses to call WHO
const LATEST_YEAR_SORT = "$orderby=TimeDim desc&$top=1";

// --- Initialize Country List on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    populateCountryList();
});

/**
 * Fetches the list of countries from WHO API via Netlify function and populates the select element
 */
async function populateCountryList() {
    const countrySelect = document.getElementById('country');
    
    try {
        // Show loading state
        countrySelect.disabled = true;
        const defaultOption = countrySelect.options[0];
        countrySelect.innerHTML = '<option value="" disabled selected>Loading countries...</option>';

        // Fetch countries from our Netlify function
        const response = await fetch('/.netlify/functions/get-country-list');
        
        if (!response.ok) {
            // Try to get error details from response body
            let errorDetails = `Failed to fetch countries: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorDetails = errorData.error;
                }
                if (errorData.details) {
                    errorDetails += ` - ${errorData.details}`;
                }
                console.error('Error response body:', errorData);
            } catch (e) {
                console.error('Could not parse error response:', e);
            }
            throw new Error(errorDetails);
        }

        const data = await response.json();

        // Check if we got valid data
        if (!data.value || !Array.isArray(data.value)) {
            throw new Error('Invalid country data received');
        }

        // Sort countries alphabetically by Title
        const countries = data.value.sort((a, b) => a.Title.localeCompare(b.Title));

        // Reset select element
        countrySelect.innerHTML = '<option value="" disabled selected>-- Select Country --</option>';

        // Add each country as an option
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.Code; // The WHO country code
            option.textContent = country.Title; // The country name
            countrySelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error populating country list:', error);
        countrySelect.innerHTML = '<option value="" disabled selected>Error loading countries - please refresh</option>';
    } finally {
        countrySelect.disabled = false;
    }
}

// --- Data: Motivational Quotes ---
// We will now fetch quotes from ZenQuotes API instead of using a hard-coded array.
// const quotes = [
//     "Time is the most valuable thing a man can spend. - Theophrastus",
//     "Lost time is never found again. - Benjamin Franklin",
//     "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
//     "The key is in not spending time, but in investing it. - Stephen R. Covey",
//     "The future is something which everyone reaches at the rate of sixty minutes an hour, whatever he does, whoever he is. - C.S. Lewis",
//     "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
//     "Time flies over us, but leaves its shadow behind. - Nathaniel Hawthorne",
//     "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb"
//     // Add more quotes if you like
// ];

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

// Add keyboard event listeners for Enter key
document.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const currentStep = document.querySelector('.step.active');

        // Prevent default form submission behavior
        event.preventDefault();

        // Handle different steps
        if (currentStep.id === 'step-intro') {
            nextStep('step-age');
        }
        else if (currentStep.id === 'step-age') {
            if (validateAge()) {
                nextStep('step-sex');
            }
        }
        else if (currentStep.id === 'step-sex') {
            if (validateSex()) {
                nextStep('step-country');
            }
        }
        else if (currentStep.id === 'step-country') {
            if (validateCountry()) {
                nextStep('step-worry');
            }
        }
        else if (currentStep.id === 'step-worry') {
            calculateTime();
        }
    }
});

// --- Functions ---

/**
 * Validates the age input
 * @returns {boolean} - Whether the age input is valid
 */
function validateAge() {
    const age = parseInt(ageInput.value);
    if (isNaN(age) || age < 1 || age > 120) {
        alert('Please enter a valid age between 1 and 120.');
        return false;
    }
    return true;
}

/**
 * Validates the sex selection
 * @returns {boolean} - Whether a sex option is selected
 */
function validateSex() {
    const selectedSex = document.querySelector('input[name="sex"]:checked');
    if (!selectedSex) {
        alert('Please select your biological sex.');
        return false;
    }
    return true;
}

/**
 * Validates the country selection
 * @returns {boolean} - Whether a country is selected
 */
function validateCountry() {
    if (!countrySelect.value) {
        alert('Please select your country.');
        return false;
    }
    return true;
}

/**
 * Hides all steps and shows the step with the specified ID.
 * Includes validation for each step.
 * @param {string} nextStepId - The ID of the HTML section element to show.
 */
function nextStep(nextStepId) {
    // Validate current step before proceeding
    const currentStep = document.querySelector('.step.active');
    
    if (currentStep.id === 'step-age' && nextStepId === 'step-sex') {
        if (!validateAge()) return;
    }
    else if (currentStep.id === 'step-sex' && nextStepId === 'step-country') {
        if (!validateSex()) return;
    }
    else if (currentStep.id === 'step-country' && nextStepId === 'step-worry') {
        if (!validateCountry()) return;
    }

    // If validation passes, proceed to next step
    steps.forEach(step => step.classList.remove('active')); // Hide all
    const nextStepElement = document.getElementById(nextStepId);
    if (nextStepElement) {
        nextStepElement.classList.add('active'); // Show the target one
    } else {
        console.error("Error: Step not found with ID:", nextStepId);
    }
}

/**
 * Browses back to the previous step without validation
 * @param {string} prevStepId - The ID of the HTML section element to show.
 */
function prevStep(prevStepId) {
    steps.forEach(step => step.classList.remove('active')); // Hide all
    const prevStepElement = document.getElementById(prevStepId);
    if (prevStepElement) {
        prevStepElement.classList.add('active'); // Show the previous one
    } else {
        console.error("Error: Previous step not found with ID:", prevStepId);
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
    const apiUrl = `/.netlify/functions/get-life-expectancy?country=${encodeURIComponent(countryCode)}&sex=${encodeURIComponent(sexCode)}`;

    console.log("Attempting to fetch Netlify Function:", apiUrl); // Log request to Netlify function

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
        console.log("Proxy Function Response Data (raw):", data); // Log the full response

        // Parse the response FROM WHO (passed through the proxy)
        // Check if 'value' array exists and has entries
        if (data && data.value && data.value.length > 0) {
            // Check if the first entry has the 'NumericValue' property
            if (typeof data.value[0].NumericValue !== 'undefined') {
                const lifeExp = parseFloat(data.value[0].NumericValue);
                console.log("Parsed Life Expectancy:", lifeExp); // Log the extracted value
                return lifeExp; // Return the number
            } else {
                console.error("Proxy returned data, but missing 'NumericValue' property:", data.value[0]);
                resultsSummaryDiv.innerHTML = `
                    <p style='color: #e67e22;'>
                        <strong>⚠️ Data Unavailable</strong><br>
                        We couldn't find specific life expectancy data for your selection. This sometimes happens with newer or incomplete datasets.
                        <br><br>
                        You can try:
                        <ul>
                            <li>Selecting a different country</li>
                            <li>Checking back later as data is updated periodically</li>
                        </ul>
                    </p>`;
                return null; // Indicate unexpected data structure
            }
        } else {
            // Handle the case where 'value' array is empty or missing in the WHO data
            if (data && data.value && data.value.length === 0) {
                console.warn(`Proxy returned data, but WHO 'value' array is empty for ${countryCode}/${sexCode}. No matching data found.`);
                resultsSummaryDiv.innerHTML = `
                    <p style='color: #e67e22;'>
                        <strong>⚠️ No Data Available</strong><br>
                        Unfortunately, we don't have life expectancy data for your selected country and demographic combination.
                        <br><br>
                        This could be because:
                        <ul>
                            <li>The data hasn't been reported to WHO recently</li>
                            <li>The country might be using a different reporting system</li>
                            <li>The specific demographic data is not available</li>
                        </ul>
                        <br>
                        Try selecting a different country or check back later.
                    </p>`;
            } else {
                console.error("Could not find expected 'value' array in proxy response structure or it was empty:", data);
                resultsSummaryDiv.innerHTML = `
                    <p style='color: #e67e22;'>
                        <strong>⚠️ Data Format Issue</strong><br>
                        We received a response from WHO, but the data format was unexpected.
                        <br><br>
                        Please try:
                        <ul>
                            <li>Selecting a different country</li>
                            <li>Refreshing the page</li>
                            <li>Trying again in a few minutes</li>
                        </ul>
                    </p>`;
            }
            return null; // Indicate no data found or parsing failure
        }

    } catch (error) {
        // Handle network errors contacting OUR NETLIFY FUNCTION
        console.error("Network error fetching Netlify function:", error);
        resultsSummaryDiv.innerHTML = `
            <p style='color: #e67e22;'>
                <strong>⚠️ Connection Issue</strong><br>
                We couldn't connect to our data service at the moment.
                <br><br>
                Please check:
                <ul>
                    <li>Your internet connection</li>
                    <li>If you're using a VPN or firewall, try disabling it</li>
                    <li>Try refreshing the page</li>
                </ul>
                <br>
                If the problem persists, please try again later.
            </p>`;
        return null; // Indicate failure clearly
    }
}

/**
 * Fetches a random motivational quote from ZenQuotes API via Netlify function.
 * @returns {Promise<object|null>} A Promise that resolves with the quote object {q: 'quote', a: 'author'}, or null if an error occurs.
 */
async function fetchRandomQuote() {
    // Call our new Netlify Function proxy instead of the external API directly
    const apiUrl = '/.netlify/functions/get-quote';

    console.log("Attempting to fetch quote via Netlify Function:", apiUrl); // Log request to Netlify function

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            console.error(`Error fetching quote via proxy function: ${response.status}`);
            // Try to parse error body from our function if available
            let errorDetails = 'Failed to fetch quote.';
            try {
                const errorBody = await response.json();
                if (errorBody && errorBody.error) {
                    errorDetails = errorBody.error;
                }
            } catch (parseError) {
                console.error('Could not parse error body from quote proxy function.', parseError);
            }
            console.error('Quote proxy function returned error details:', errorDetails);
            // We won't return null here; let showNewQuote handle the display of the error message
            return null; 
        }

        const data = await response.json();
        console.log("Quote Proxy Function Response Data:", data); // Log the data received from our function

        // The proxy function should return a single quote object {q: 'quote', a: 'author'}
        if (data && data.q && data.a) {
            return data; // Return the quote object
        } else {
            console.error('Received invalid data structure from quote proxy API', data);
            return null;
        }

    } catch (error) {
        console.error('Network error fetching quote proxy function:', error);
        return null;
    }
}

/**
 * Shows a new random quote in the quote div, fetched from API
 */
async function showNewQuote() {
    const quote = await fetchRandomQuote();
    if (quote) {
        quoteDiv.innerHTML = `"${quote.q}" - ${quote.a}`; // Display quote and author
    } else {
        // This message will be shown if fetchRandomQuote returned null (due to API error or invalid data)
        quoteDiv.textContent = 'Could not fetch a quote at this time.'; 
    }
}

/**
 * Main function to calculate and display the time breakdown.
 * This function is asynchronous because it calls the async fetchLifeExpectancy function.
 */
async function calculateTime() {
    // Validate all inputs before proceeding
    if (!validateAge() || !validateSex() || !validateCountry()) {
        return;
    }

    // --- Stage 1: Setup ---
    loadingDiv.style.display = 'block';
    resultsSummaryDiv.innerHTML = '';
    // Clear previous quote before fetching new one
    quoteDiv.textContent = ''; 
    nextStep('step-results');

    // --- Stage 2: Get User Inputs ---
    const currentAge = parseInt(ageInput.value);
    let selectedSex = null; // This will hold 'SEX_MLE' or 'SEX_FMLE'
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
    const avgLifeExpectancy = await fetchLifeExpectancy(selectedCountryCode, selectedSex);

    // --- Stage 5: Process API Result & Calculate ---
    loadingDiv.style.display = 'none'; // Hide "Fetching data..." message now

    // Check if fetchLifeExpectancy already displayed an error/warning message
    if (resultsSummaryDiv.innerHTML.includes("Error:") || resultsSummaryDiv.innerHTML.includes("Warning:")) {
         // Error/Warning was already handled and displayed within fetchLifeExpectancy
         // Optionally add quote even if data missing:
         // const randomIndex = Math.floor(Math.random() * quotes.length);
         // quoteDiv.textContent = `"${quotes[randomIndex]}"`;
         return;
    }

    // Only proceed if avgLifeExpectancy has a valid number
    if (avgLifeExpectancy === null || avgLifeExpectancy <= 0) {
        // Fallback error if something unexpected happened
        if (!resultsSummaryDiv.innerHTML) { // Avoid overwriting specific messages
             resultsSummaryDiv.innerHTML = `<p style='color: red;'>Error: An unknown issue occurred while fetching or processing life expectancy data.</p>`;
        }
    } else {
        // Calculation successful! Proceed with calculations.
        const yearsRemaining = Math.max(0, avgLifeExpectancy - currentAge);
        const totalDaysRemaining = yearsRemaining * 365.25;
        const totalHoursRemaining = totalDaysRemaining * 24;
        const totalWorryHours = dailyWorryHours * totalDaysRemaining;
        const effectiveHoursRemaining = totalHoursRemaining - totalWorryHours;

        // Calculate years equivalents for worry time
        const worryYears = totalWorryHours / (24 * 365.25);
        const effectiveYearsRemaining = effectiveHoursRemaining / (24 * 365.25);

        // *** Calculate day equivalents ***
        const totalWorryDays = totalWorryHours / 24;
        const effectiveDaysRemaining = effectiveHoursRemaining / 24;
        // *** END Calculate day equivalents ***

        const approxWakingHoursRemaining = yearsRemaining * 365.25 * (24 - 8);
        const worryPercentage = approxWakingHoursRemaining > 0 ? (totalWorryHours / approxWakingHoursRemaining) * 100 : 0;

        // --- Stage 6: Display Results (Updated to match dark editorial UI) ---
        let resultsHTML = `
            <h2 class="results-header">Your Time Breakdown Results</h2>
            
            <div class="results-hero-section">
                <img src="assets/hourglass_results.png" class="results-image" alt="Hourglass">
                <div class="results-data">
        `;

        if (yearsRemaining > 0) {
            resultsHTML += `
                    <div class="data-row">
                        <span class="icon-circle icon-gold">&#10005;</span>
                        <span class="data-text-small"><strong>${worryYears.toFixed(1)} years</strong> spent worrying (${worryPercentage.toFixed(1)}%)</span>
                    </div>
                    
                    <p class="data-main-number">${yearsRemaining.toFixed(1)} years</p>
                    <p class="data-subtitle">Estimated remaining time at age ${currentAge}</p>
                    
                    <div class="data-row">
                        <span class="icon-circle icon-green">&#10003;</span>
                        <span class="data-text-small"><strong>${effectiveYearsRemaining.toFixed(1)} years</strong> worry-free time (${(100 - worryPercentage).toFixed(1)}%)</span>
                    </div>
                    
                    <div style="margin-top: 2rem; display: flex; height: 12px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
                        <div style="width: ${worryPercentage}%; background: linear-gradient(90deg, var(--gold), #f87171);"></div>
                        <div style="width: ${100 - worryPercentage}%; background: linear-gradient(90deg, #4ade80, #22c55e);"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #9ca3af; margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">
                        <span style="width: ${worryPercentage}%; text-align: left;">Worry Time</span>
                        <span style="width: ${100 - worryPercentage}%; text-align: right;">Worry-Free Time</span>
                    </div>
                </div>
            </div>`;

            if (worryYears >= 1) {
                resultsHTML += `
            <div class="perspective-section">
                <h3 class="perspective-title">Perspective: What you could do in ${worryYears.toFixed(1)} years</h3>
                <div class="perspective-cards">
                    <div class="p-card">
                        <div class="p-card-icon">📖</div>
                        <div class="p-card-title">Learn a New Language</div>
                        <div class="p-card-desc">Master French, Japanese, or any language you desire.</div>
                    </div>
                    <div class="p-card">
                        <div class="p-card-icon">🌐</div>
                        <div class="p-card-title">Travel the World</div>
                        <div class="p-card-desc">Visit dozens of countries and experience new cultures.</div>
                    </div>
                    <div class="p-card">
                        <div class="p-card-icon">🖌️</div>
                        <div class="p-card-title">Discover a Passion</div>
                        <div class="p-card-desc">Write a novel, learn an instrument, or start a business.</div>
                    </div>
                </div>
            </div>`;
            }
        } else {
            resultsHTML += `
                    <p class="data-main-number">Bonus Time</p>
                    <p class="data-subtitle">According to averages, you've reached or surpassed the life expectancy. Every day is a bonus!</p>
                </div>
            </div>`;
        }

        resultsSummaryDiv.innerHTML = resultsHTML;

        // --- Stage 7: Display Quote ---
        await showNewQuote();
    }
}

// --- Initial Setup ---
// This runs when the HTML page has fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Ensure only the intro step ('step-intro') is visible when the page loads
    steps.forEach((step, index) => {
        step.classList.toggle('active', step.id === 'step-intro');
    });
    // Set the initial text for the worry slider output
    worryOutput.textContent = `${worrySlider.value} hour${worrySlider.value == 1 ? '' : 's'}`;
});

/**
 * Resets the calculator to the initial state
 */
function resetCalculator() {
    // Reset form inputs
    ageInput.value = '';
    sexInputs.forEach(input => input.checked = false);
    countrySelect.selectedIndex = 0;
    worrySlider.value = 1;
    worryOutput.textContent = '1 hour';

    // Clear results and quote
    resultsSummaryDiv.innerHTML = '';
    quoteDiv.textContent = '';
    
    // Go back to first step
    nextStep('step-intro'); // Assuming intro is the first step now
}