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
            throw new Error(`Failed to fetch countries: ${response.status}`);
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

// --- Data: Emergency Numbers ---
const emergencyNumbers = {
    americas: [
        { flag: "🇦🇷", name: "Argentina", number: "135 (Buenos Aires) / 0800 345 1435 (nationwide)" },
        { flag: "🇧🇴", name: "Bolivia", number: "800 11 0077" },
        { flag: "🇧🇷", name: "Brazil", number: "188" },
        { flag: "🇨🇦", name: "Canada", number: "988" },
        { flag: "🇨🇱", name: "Chile", number: "600 360 7777" },
        { flag: "🇨🇴", name: "Colombia", number: "106" },
        { flag: "🇨🇷", name: "Costa Rica", number: "800 376 76 76" },
        { flag: "🇩🇴", name: "Dominican Republic", number: "*462" },
        { flag: "🇪🇨", name: "Ecuador", number: "171" },
        { flag: "🇬🇹", name: "Guatemala", number: "502 2298 3579" },
        { flag: "🇭🇳", name: "Honduras", number: "2236 4000" },
        { flag: "🇲🇽", name: "Mexico", number: "800 472 7835" },
        { flag: "🇵🇦", name: "Panama", number: "800 2121" },
        { flag: "🇵🇾", name: "Paraguay", number: "021 204 019" },
        { flag: "🇵🇪", name: "Peru", number: "113 opción 5" },
        { flag: "🇺🇸", name: "United States", number: "988" },
        { flag: "🇺🇾", name: "Uruguay", number: "0800 0767" },
        { flag: "🇻🇪", name: "Venezuela", number: "0 800 838 4333" }
    ],
    europe: [
        { flag: "🇦🇹", name: "Austria", number: "142" },
        { flag: "🇧🇪", name: "Belgium", number: "0800 32 123" },
        { flag: "🇭🇷", name: "Croatia", number: "116 123" },
        { flag: "🇨🇿", name: "Czech Republic", number: "116 111" },
        { flag: "🇩🇰", name: "Denmark", number: "70 201 201" },
        { flag: "🇫🇮", name: "Finland", number: "09 2525 0116" },
        { flag: "🇫🇷", name: "France", number: "01 45 39 40 00" },
        { flag: "🇩🇪", name: "Germany", number: "0800 111 0 111" },
        { flag: "🇬🇷", name: "Greece", number: "1018" },
        { flag: "🇭🇺", name: "Hungary", number: "116 123" },
        { flag: "🇮🇪", name: "Ireland", number: "116 123" },
        { flag: "🇮🇹", name: "Italy", number: "0223 232 325" },
        { flag: "🇱🇻", name: "Latvia", number: "116 123" },
        { flag: "🇱🇹", name: "Lithuania", number: "8 800 28888" },
        { flag: "🇱🇺", name: "Luxembourg", number: "454545" },
        { flag: "🇳🇱", name: "Netherlands", number: "0800 0113" },
        { flag: "🇳🇴", name: "Norway", number: "116 123" },
        { flag: "🇵🇱", name: "Poland", number: "800 70 2222" },
        { flag: "🇵🇹", name: "Portugal", number: "213 544 545" },
        { flag: "🇷🇴", name: "Romania", number: "0800 801 200" },
        { flag: "🇷🇺", name: "Russia", number: "051" },
        { flag: "🇷🇸", name: "Serbia", number: "0800 300 303" },
        { flag: "🇸🇰", name: "Slovakia", number: "0800 500 333" },
        { flag: "🇸🇮", name: "Slovenia", number: "116 123" },
        { flag: "🇪🇸", name: "Spain", number: "900 202 010" },
        { flag: "🇸🇪", name: "Sweden", number: "90101" },
        { flag: "🇨🇭", name: "Switzerland", number: "143" },
        { flag: "🇬🇧", name: "United Kingdom", number: "116 123" }
    ],
    asia: [
        { flag: "🇦🇺", name: "Australia", number: "13 11 14" },
        { flag: "🇧🇩", name: "Bangladesh", number: "+880 172 524 1771" },
        { flag: "🇨🇳", name: "China", number: "800 810 1117 or 010 8295 1332" },
        { flag: "🇭🇰", name: "Hong Kong", number: "2896 0000" },
        { flag: "🇮🇳", name: "India", number: "+91 9152987821" },
        { flag: "🇮🇩", name: "Indonesia", number: "+62 21 5084 1745" },
        { flag: "🇯🇵", name: "Japan", number: "+81 3 5286 9090" },
        { flag: "🇲🇾", name: "Malaysia", number: "603 7627 2929" },
        { flag: "🇳🇿", name: "New Zealand", number: "0800 543 354" },
        { flag: "🇵🇭", name: "Philippines", number: "1553" },
        { flag: "🇸🇬", name: "Singapore", number: "1767" },
        { flag: "🇰🇷", name: "South Korea", number: "1577 0199" },
        { flag: "🇹🇼", name: "Taiwan", number: "1995" },
        { flag: "🇹🇭", name: "Thailand", number: "1323" },
        { flag: "🇻🇳", name: "Vietnam", number: "1900 6237" }
    ],
    africa: [
        { flag: "🇿🇦", name: "South Africa", number: "0800 567 567" },
        { flag: "🇪🇬", name: "Egypt", number: "+20 2 762 1602" },
        { flag: "🇬🇭", name: "Ghana", number: "0800 111 222" },
        { flag: "🇰🇪", name: "Kenya", number: "+254 722 178177" },
        { flag: "🇲🇦", name: "Morocco", number: "0800 00 47 47" },
        { flag: "🇳🇬", name: "Nigeria", number: "0809 111 6264" },
        { flag: "🇸🇳", name: "Senegal", number: "33 860 42 42" },
        { flag: "🇹🇳", name: "Tunisia", number: "8010 1111" },
        { flag: "🇺🇬", name: "Uganda", number: "+256 414 664 603" },
        { flag: "🇿🇼", name: "Zimbabwe", number: "+263 71 643 4732" }
    ]
};

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

// Add elements for hamburger menu and help modal
const hamburgerIcon = document.getElementById('hamburger-icon');
const mobileNav = document.getElementById('mobile-nav');
const helpButtonDesktop = document.getElementById('help-button-desktop');
const helpButtonMobile = document.getElementById('help-button-mobile');
const helpModal = document.getElementById('help-modal');
const closeModalButton = document.querySelector('.modal .close-button');

// --- Event Listeners ---
// Update the displayed worry hours when the slider changes
worrySlider.addEventListener('input', () => {
    worryOutput.textContent = `${worrySlider.value} hour${worrySlider.value == 1 ? '' : 's'}`;
});

// Add keyboard event listeners for Enter key
document.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        // Prevent default form submission behavior
        event.preventDefault();

        const currentStep = document.querySelector('.step.active');
        
        // Do not proceed if modal is open
        if (helpModal.style.display === 'block') {
            return;
        }

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

// Add event listener for hamburger icon click
hamburgerIcon.addEventListener('click', () => {
    mobileNav.classList.toggle('active');
});

// Add event listeners for help buttons
helpButtonDesktop.addEventListener('click', showHelpModal);
helpButtonMobile.addEventListener('click', showHelpModal);

// Add event listener for modal close button
closeModalButton.addEventListener('click', closeHelpModal);

// Close modal if clicked outside of modal content
window.addEventListener('click', (event) => {
    if (event.target == helpModal) {
        closeHelpModal();
    }
});

// --- Functions ---

/**
 * Shows the help modal.
 */
function showHelpModal() {
    helpModal.style.display = 'block';
    populateEmergencyNumbers();
}

/**
 * Hides the help modal.
 */
function closeHelpModal() {
    helpModal.style.display = 'none';
}

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

        // --- Stage 6: Display Results (Updated to emphasize years) ---
        // Determine display text for sex code
        let sexDisplay = selectedSex; // Default
        if (selectedSex === 'SEX_MLE') sexDisplay = 'Male';
        if (selectedSex === 'SEX_FMLE') sexDisplay = 'Female';

        let resultsHTML = `
            <p>According to the World Health Organization (WHO), the average life expectancy for ${selectedCountryName} (${sexDisplay}) is around <strong>${avgLifeExpectancy.toFixed(1)} years</strong>.</p>
            <p>At age ${currentAge}, you have approximately:</p>
            <div style="text-align: center; margin: 1.5em 0; padding: 1em; background-color: #f8f9fa; border-radius: 8px;">
                <span style="font-size: 1.8em; color: #2c3e50;"><strong>${yearsRemaining.toFixed(1)} years</strong></span>
                <br>
                <span style="color: #666; font-size: 0.9em;">
                    (that's about ${totalDaysRemaining.toLocaleString(undefined, {maximumFractionDigits: 0})} days or 
                    ${totalHoursRemaining.toLocaleString(undefined, {maximumFractionDigits: 0})} hours)
                </span>
            </div>
        `;

        if (yearsRemaining > 0) {
            resultsHTML += `
                <hr style="border: 0; border-top: 1px dashed #ccc; margin: 1em 0;">
                <p>If you spend <strong>${dailyWorryHours} hours</strong> worrying each day, over your remaining time that adds up to:</p>
                <div style="text-align: center; margin: 1em 0; padding: 1em; background-color: #fff3e0; border-radius: 8px;">
                    <span style="font-size: 1.4em; color: #e67e22;"><strong>${worryYears.toFixed(1)} years</strong> spent worrying</span>
                    <br>
                    <span style="color: #666; font-size: 0.9em;">
                        (approximately ${totalWorryDays.toLocaleString(undefined, {maximumFractionDigits: 0})} days or 
                        ${totalWorryHours.toLocaleString(undefined, {maximumFractionDigits: 0})} hours)
                    </span>
                </div>
                <p>That worry time represents <strong>${worryPercentage.toFixed(1)}%</strong> of your potential remaining <em>waking</em> hours.</p>
                <p>Your effective time remaining (after subtracting worry time) would be:</p>
                <div style="text-align: center; margin: 1em 0; padding: 1em; background-color: #e8f5e9; border-radius: 8px;">
                    <span style="font-size: 1.6em; color: #2e7d32;"><strong>${effectiveYearsRemaining.toFixed(1)} years</strong> of worry-free time</span>
                    <br>
                    <span style="color: #666; font-size: 0.9em;">
                        (about ${effectiveDaysRemaining.toLocaleString(undefined, {maximumFractionDigits: 0})} days or 
                        ${effectiveHoursRemaining.toLocaleString(undefined, {maximumFractionDigits: 0})} hours)
                    </span>
                </div>
            `;

            // Add a practical perspective if worry time is significant
            if (worryYears >= 1) {
                resultsHTML += `
                    <div style="margin-top: 1.5em; padding: 1em; background-color: #f5f5f5; border-radius: 8px;">
                        <p style="margin: 0;"><strong>💡 Perspective:</strong> In ${worryYears.toFixed(1)} years, you could:</p>
                        <ul style="margin-top: 0.5em;">
                            <li>Learn multiple languages</li>
                            <li>Complete a degree program</li>
                            <li>Master several new skills</li>
                            <li>Travel to dozens of countries</li>
                        </ul>
                    </div>
                `;
            }
        } else {
            resultsHTML += `<p>According to averages, you've reached or surpassed the average life expectancy for your selection. Every day is a bonus!</p>`;
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

// --- Functions for Emergency Numbers ---

/**
 * Populates the emergency numbers lists when the help modal is opened
 */
function populateEmergencyNumbers() {
    const regions = ['americas', 'europe', 'asia', 'africa'];
    regions.forEach(region => {
        const listElement = document.getElementById(`${region}-list`);
        if (listElement) {
            listElement.innerHTML = emergencyNumbers[region]
                .map(country => `
                    <div class="country-item">
                        <span class="country-flag">${country.flag}</span>
                        <div class="country-info">
                            <div class="country-name">${country.name}</div>
                            <div class="phone-number">${country.number}</div>
                        </div>
                    </div>
                `).join('');
        }
    });
}

/**
 * Filters the emergency numbers based on search input
 */
function filterCountries() {
    const searchTerm = document.getElementById('country-search').value.toLowerCase();
    const regions = ['americas', 'europe', 'asia', 'africa'];
    
    regions.forEach(region => {
        const listElement = document.getElementById(`${region}-list`);
        if (listElement) {
            const filteredCountries = emergencyNumbers[region].filter(country => 
                country.name.toLowerCase().includes(searchTerm) || 
                country.number.toLowerCase().includes(searchTerm)
            );
            
            listElement.innerHTML = filteredCountries
                .map(country => `
                    <div class="country-item">
                        <span class="country-flag">${country.flag}</span>
                        <div class="country-info">
                            <div class="country-name">${country.name}</div>
                            <div class="phone-number">${country.number}</div>
                        </div>
                    </div>
                `).join('');
        }
    });
}