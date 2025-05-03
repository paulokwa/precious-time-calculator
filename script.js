// script.js - Added display for Years, Days, Hours

// --- API Configuration Constants ---
const API_BASE_URL = "https://ghoapi.azureedge.net/api/";
const LIFE_EXPECTANCY_INDICATOR = "WHOSIS_000001";
const SEX_PARAM_FILTER = "Dim1";
const COUNTRY_PARAM_FILTER = "SpatialDim";
const LATEST_YEAR_SORT = "$orderby=TimeDim desc&$top=1";

// --- Data: Motivational Quotes ---
const quotes = [
    "Time is the most valuable thing a man can spend. - Theophrastus",
    "Lost time is never found again. - Benjamin Franklin",
    "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
    "The key is in not spending time, but in investing it. - Stephen R. Covey",
    "The future is something which everyone reaches at the rate of sixty minutes an hour, whatever he does, whoever he is. - C.S. Lewis",
    "Don’t watch the clock; do what it does. Keep going. - Sam Levenson",
    "Time flies over us, but leaves its shadow behind. - Nathaniel Hawthorne",
    "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
    "Yesterday is gone. Tomorrow has not yet come. We have only today. Let us begin. - Mother Teresa",
    "Time isn't the main thing. It's the only thing. - Miles Davis"
];

// --- DOM Elements ---
const ageInput = document.getElementById('age');
const sexInputs = document.querySelectorAll('input[name="sex"]');
const countrySelect = document.getElementById('country');
const worrySlider = document.getElementById('worry-hours');
const worryOutput = document.getElementById('worry-output');
const resultsSummaryDiv = document.getElementById('results-summary');
const quoteDiv = document.getElementById('motivational-quote');
const loadingDiv = document.getElementById('results-loading');
const steps = document.querySelectorAll('.step');
const refreshQuoteBtn = document.getElementById('refresh-quote-btn');
const restartBtn = document.getElementById('restart-btn');


// --- Event Listeners ---
worrySlider.addEventListener('input', () => {
    worryOutput.textContent = `${worrySlider.value} hour${worrySlider.value == 1 ? '' : 's'}`;
});

// --- Functions ---

/**
 * Hides all steps and shows the step with the specified ID.
 */
function nextStep(nextStepId) {
    steps.forEach(step => step.classList.remove('active'));
    const nextStepElement = document.getElementById(nextStepId);
    if (nextStepElement) {
        nextStepElement.classList.add('active');
    } else {
        console.error("Error: Step not found with ID:", nextStepId);
    }
}

/**
 * Fetches the country list from our Netlify proxy function and populates the dropdown.
 */
async function populateCountryDropdown() {
    const countrySelect = document.getElementById('country');
    const defaultOptionText = "-- Select Country --";
    countrySelect.innerHTML = `<option value="" disabled selected>${defaultOptionText}</option>`;
    const apiUrl = '/.netlify/functions/get-country-list';
    console.log("Attempting to fetch country list via Netlify function:", apiUrl);
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error fetching country list from proxy:", response.status, errorData);
            countrySelect.innerHTML = `<option value="" disabled selected>Error loading countries</option>`;
            return;
        }
        const data = await response.json();
        if (data && data.value && Array.isArray(data.value)) {
            console.log("Received country list data:", data.value.length);
            data.value.sort((a, b) => {
                if (!a.Title) return 1;
                if (!b.Title) return -1;
                return a.Title.localeCompare(b.Title);
            });
            data.value.forEach(country => {
                if (country.Code && country.Title) {
                     const option = document.createElement('option');
                     option.value = country.Code;
                     option.textContent = country.Title;
                     countrySelect.appendChild(option);
                } else {
                    console.warn("Skipping country entry with missing Code or Title:", country);
                }
            });
            console.log("Country dropdown populated.");
        } else {
             console.error("Unexpected data structure received for country list:", data);
             countrySelect.innerHTML = `<option value="" disabled selected>Error: Invalid data</option>`;
        }
    } catch (error) {
        console.error("Error fetching or processing country list:", error);
         countrySelect.innerHTML = `<option value="" disabled selected>Error loading countries</option>`;
    }
}


/**
 * Fetches Life Expectancy data VIA THE NETLIFY PROXY FUNCTION.
 */
async function fetchLifeExpectancy(countryCode, sexCode) {
    const apiUrl = `/.netlify/functions/get-life-expectancy?country=${encodeURIComponent(countryCode)}&sex=${encodeURIComponent(sexCode)}`;
    console.log("Attempting to fetch Netlify Function:", apiUrl);
    try {
        const response = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
        if (!response.ok) {
            console.error(`Netlify Function Error: ${response.status} ${response.statusText}`);
            let errorData = { error: `Proxy function returned status ${response.status}` };
            try {
                 errorData = await response.json();
                 console.error("Netlify Function Response Body on Error:", errorData);
            } catch (parseError) {
                 console.error("Could not parse error response body from Netlify function.");
            }
            resultsSummaryDiv.innerHTML = `<p style='color: red;'>Error: ${errorData.error || 'Failed to get data via proxy function.'} ${errorData.details ? '(' + errorData.details + ')' : ''}</p>`;
            return null;
        }
        const data = await response.json();
        console.log("Proxy Function Response Data (raw):", data);
        if (data && data.value && data.value.length > 0) {
            if (typeof data.value[0].NumericValue !== 'undefined') {
                const lifeExp = parseFloat(data.value[0].NumericValue);
                console.log("Parsed Life Expectancy:", lifeExp);
                return lifeExp;
            } else {
                console.error("Proxy returned data, but missing 'NumericValue' property:", data.value[0]);
                resultsSummaryDiv.innerHTML = `<p style='color: red;'>Error: Received data from proxy, but format was unexpected (Missing NumericValue).</p>`;
                return null;
            }
        } else {
            if (data && data.value && data.value.length === 0) {
                console.warn(`Proxy returned data, but WHO 'value' array is empty for ${countryCode}/${sexCode}. No matching data found.`);
                resultsSummaryDiv.innerHTML = `<p style='color: orange;'>Warning: No specific life expectancy data found for ${countryCode}/${sexCode} via WHO API.</p>`;
            } else {
                console.error("Could not find expected 'value' array in proxy response structure or it was empty:", data);
                resultsSummaryDiv.innerHTML = `<p style='color: red;'>Error: Received unexpected data structure from proxy.</p>`;
            }
            return null;
        }
    } catch (error) {
        console.error("Network error fetching Netlify function:", error);
        resultsSummaryDiv.innerHTML = `<p style='color: red;'>Error: Could not connect to the proxy function. Check network or Netlify Dev status.</p>`;
        return null;
    }
}

/**
 * Displays a new random quote in the quote div.
 */
function displayNewQuote() {
    if (quotes && quotes.length > 0 && quoteDiv) {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteDiv.textContent = `"${quotes[randomIndex]}"`;
        console.log("Displayed new quote.");
    } else {
        console.error("Could not display new quote. Quotes array or quoteDiv missing.");
    }
}

/**
 * Resets the form inputs and returns to the first step.
 */
function restartCalculator() {
    ageInput.value = '';
    sexInputs.forEach(input => input.checked = false);
    countrySelect.selectedIndex = 0;
    worrySlider.value = 1;
    worryOutput.textContent = `${worrySlider.value} hour${worrySlider.value == 1 ? '' : 's'}`;
    resultsSummaryDiv.innerHTML = '';
    quoteDiv.textContent = '';
    if(refreshQuoteBtn) refreshQuoteBtn.style.display = 'none'; // Hide buttons on restart
    if(restartBtn) restartBtn.style.display = 'none';
    nextStep('step-age');
    console.log("Calculator restarted.");
}


/**
 * Main function to calculate and display the time breakdown.
 */
async function calculateTime() {
    // --- Stage 1: Setup ---
    loadingDiv.style.display = 'block';
    resultsSummaryDiv.innerHTML = '';
    quoteDiv.textContent = '';
    if(refreshQuoteBtn) refreshQuoteBtn.style.display = 'none';
    if(restartBtn) restartBtn.style.display = 'none';
    nextStep('step-results');

    // --- Stage 2: Get User Inputs ---
    const currentAge = parseInt(ageInput.value);
    let selectedSex = null;
    sexInputs.forEach(input => {
        if (input.checked) {
            selectedSex = input.value;
        }
    });
    const selectedCountryCode = countrySelect.value;
    const dailyWorryHours = parseFloat(worrySlider.value);
    const selectedCountryName = countrySelect.options[countrySelect.selectedIndex].text;

    // --- Stage 3: Validate Inputs ---
    if (isNaN(currentAge) || currentAge <= 0 || !selectedSex || !selectedCountryCode || isNaN(dailyWorryHours)) {
        resultsSummaryDiv.innerHTML = "<p style='color: red;'>Error: Please go back and ensure Age, Sex, Country, and Worry Time are all set correctly.</p>";
        loadingDiv.style.display = 'none';
        if(restartBtn) restartBtn.style.display = 'inline-block';
        if(refreshQuoteBtn) refreshQuoteBtn.style.display = 'none';
        return;
    }

    // --- Stage 4: Call the API (via Netlify Function) ---
    const avgLifeExpectancy = await fetchLifeExpectancy(selectedCountryCode, selectedSex);

    // --- Stage 5: Process API Result & Calculate ---
    loadingDiv.style.display = 'none';

    if(refreshQuoteBtn) refreshQuoteBtn.style.display = 'inline-block';
    if(restartBtn) restartBtn.style.display = 'inline-block';


    if (resultsSummaryDiv.innerHTML.includes("Error:") || resultsSummaryDiv.innerHTML.includes("Warning:")) {
         if(refreshQuoteBtn) refreshQuoteBtn.style.display = 'none';
         return;
    }

    if (avgLifeExpectancy === null || avgLifeExpectancy <= 0) {
        if (!resultsSummaryDiv.innerHTML) {
             resultsSummaryDiv.innerHTML = `<p style='color: red;'>Error: An unknown issue occurred while fetching or processing life expectancy data.</p>`;
        }
        if(refreshQuoteBtn) refreshQuoteBtn.style.display = 'none';
    } else {
        // Calculation successful!
        const yearsRemaining = Math.max(0, avgLifeExpectancy - currentAge);
        const totalDaysRemaining = yearsRemaining * 365.25;
        const totalHoursRemaining = totalDaysRemaining * 24;
        const totalWorryHours = dailyWorryHours * totalDaysRemaining;
        const effectiveHoursRemaining = totalHoursRemaining - totalWorryHours;
        const totalWorryDays = totalWorryHours / 24;
        const effectiveDaysRemaining = effectiveHoursRemaining / 24;
        // *** NEW: Calculate year equivalents ***
        const totalWorryYears = totalWorryDays / 365.25;
        const effectiveYearsRemaining = effectiveDaysRemaining / 365.25;
        // *** END NEW ***
        const approxWakingHoursRemaining = yearsRemaining * 365.25 * (24 - 8);
        const worryPercentage = approxWakingHoursRemaining > 0 ? (totalWorryHours / approxWakingHoursRemaining) * 100 : 0;

        // --- Stage 6: Display Results (Updated Attribution & Years) ---
        let sexDisplay = selectedSex;
        if (selectedSex === 'SEX_MLE') sexDisplay = 'Male';
        if (selectedSex === 'SEX_FMLE') sexDisplay = 'Female';

        // *** MODIFIED resultsHTML section ***
        let resultsHTML = `
            <p>Based on info from the World Health Organisation (WHO), average life expectancy for ${selectedCountryName} (${sexDisplay}) is around <strong>${avgLifeExpectancy.toFixed(1)} years</strong>.</p>
            <p>At age ${currentAge}, you have approximately <strong>${yearsRemaining.toFixed(1)} years</strong> remaining based on this average.</p>
            <p>That's roughly <strong>${totalDaysRemaining.toLocaleString(undefined, {maximumFractionDigits: 0})} days</strong> or <strong>${totalHoursRemaining.toLocaleString(undefined, {maximumFractionDigits: 0})} hours</strong> left in total.</p>
        `;
        if (yearsRemaining > 0) {
            resultsHTML += `
                <hr style="border: 0; border-top: 1px dashed #ccc; margin: 1em 0;">
                <p>Spending <strong>${dailyWorryHours} hours</strong> worrying daily could accumulate to roughly <strong>${totalWorryHours.toLocaleString(undefined, { maximumFractionDigits: 0 })} hours</strong> (approx. <strong>${totalWorryDays.toLocaleString(undefined, { maximumFractionDigits: 0 })} days</strong> or <strong>${totalWorryYears.toFixed(1)} years</strong>) over that remaining time.</p>
                <p>That worry time represents approximately <strong>${worryPercentage.toFixed(1)}%</strong> of your potential remaining <em>waking</em> hours.</p>
                <p style="margin-top: 1em;">Your potential effective time remaining (total minus worry time) is estimated at:</p>
                <p style="text-align: center; font-size: 1.2em; margin-top: 0.5em; line-height: 1.4;">
                    <strong>${effectiveYearsRemaining.toFixed(1)} years</strong><br/>
                    <span style="font-size: 0.9em;">(or <strong>${effectiveDaysRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} days</strong> / <strong>${effectiveHoursRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} hours</strong>)</span>
                </p>
            `;
        } else {
            resultsHTML += `<p>According to averages, you've reached or surpassed the average life expectancy for your selection. Every day is a bonus!</p>`;
        }
        // *** END MODIFIED resultsHTML section ***

        resultsHTML += `
            <p style="font-size: 0.8em; text-align: right; color: #718096; margin-top: 1.5em;">
                Source: <a href="https://apps.who.int/gho/data/view.main.SDG2016LEXv?lang=en" target="_blank" rel="noopener noreferrer" style="color: #4a5568;">WHO GHO Life Expectancy Data</a>
            </p>
        `;

        resultsSummaryDiv.innerHTML = resultsHTML;

        // --- Stage 7: Display Quote ---
        displayNewQuote(); // Call the function to display the first quote
    }
}

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Ensure only the first step ('step-age') is visible when the page loads
    steps.forEach((step, index) => {
        step.classList.toggle('active', index === 0);
    });
    // Set the initial text for the worry slider output
    worryOutput.textContent = `${worrySlider.value} hour${worrySlider.value == 1 ? '' : 's'}`;

    // Fetch and populate countries when the page loads
    populateCountryDropdown();

    // Add Event Listeners for the new buttons
    if (refreshQuoteBtn) {
        refreshQuoteBtn.addEventListener('click', displayNewQuote);
    } else {
        console.error("Refresh Quote button not found");
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', restartCalculator);
    } else {
        console.error("Restart button not found");
    }

    // Hide result action buttons initially
    if(refreshQuoteBtn) refreshQuoteBtn.style.display = 'none';
    if(restartBtn) restartBtn.style.display = 'none';

    // No Icon initialization needed here anymore
});

