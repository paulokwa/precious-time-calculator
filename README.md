# Precious Time Calculator

A web application that helps people realize the preciousness of time and visualize how much time they might spend worrying based on life expectancy data from the World Health Organization (WHO).

## Features

- Calculate your remaining time based on WHO life expectancy data
- Track and visualize how much time you spend worrying
- Get inspired with motivational quotes
- Beautiful, responsive design for desktop and mobile

## How It Works

The app uses a multi-step wizard to collect your information:
1. Your current age
2. Your biological sex (for accurate life expectancy data)
3. Your country (for country-specific life expectancy)
4. Your daily worry hours (using a slider)

Based on this data, it calculates:
- Your estimated remaining years, days, and hours
- Total time potentially spent worrying over your lifetime
- The impact on your effective remaining time

## Development Setup

### Prerequisites

- Node.js (v16 or higher recommended)
- npm (comes with Node.js)

### Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

### Running Locally

To run the project with Netlify Functions working locally, use:

```bash
npm run dev
```

This will start the Netlify Dev server, which makes the serverless functions available at `/.netlify/functions/`.

**Important:** If you use a different local server (like VS Code Live Server on port 5500), the Netlify Functions won't be available and you'll get 404 errors. You must use `npm run dev` for local development.

### Development Server Details

When you run `npm run dev`, the app will be available at:
- Local URL: http://localhost:8888
- Network URL: (shown in terminal)

The Netlify Dev server handles:
- Serving static files (HTML, CSS, JS)
- Running serverless functions in `/netlify/functions/`
- Proxying API requests to WHO and ZenQuotes APIs

## Deployment

This project is configured for deployment on Netlify:

1. Connect your repository to Netlify
2. Set the build command: `npm run build`
3. Set the publish directory: `.` (root)
4. Deploy!

The `netlify.toml` file contains the deployment configuration.

## Project Structure

```
precious-time-calculator/
├── index.html              # Main HTML file
├── script.js               # Frontend JavaScript logic
├── style.css               # Styling
├── package.json            # Dependencies
├── netlify.toml            # Netlify configuration
└── netlify/
    └── functions/
        ├── get-life-expectancy.js   # WHO life expectancy proxy
        ├── get-country-list.js      # WHO country list proxy
        └── get-quote.js             # ZenQuotes API proxy
```

## Technologies Used

- **Frontend:** Vanilla JavaScript, HTML, CSS
- **Backend:** Netlify Functions (serverless)
- **APIs:**
  - WHO Global Health Observatory (GHO) API
  - ZenQuotes API

## Browser Support

Modern browsers that support ES6+ JavaScript features.

## License

ISC
