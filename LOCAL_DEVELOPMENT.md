# Local Development Setup Guide

## The Problem
If you're seeing 404 errors for `/.netlify/functions/get-country-list`, it's because you're running the app on a simple HTTP server (like Live Server on port 5500) instead of the Netlify Dev server.

## Solution 1: Install Node.js and Use Netlify Dev (Recommended)

### Step 1: Install Node.js
1. Download Node.js from https://nodejs.org/
2. Install it (this will also install npm)
3. Restart your terminal/VS Code

### Step 2: Install Project Dependencies
Open terminal in VS Code and run:
```bash
npm install
```

### Step 3: Run the Development Server
```bash
npm run dev
```

This will start the Netlify Dev server at http://localhost:8888

**Use this URL instead of the Live Server port 5500!**

---

## Solution 2: Deploy to Netlify (Easier!)

If you don't want to install Node.js locally, you can deploy directly to Netlify:

### Option A: Deploy via Netlify Website
1. Go to https://app.netlify.com/
2. Sign up/Login
3. Click "Add new site" → "Import an existing project"
4. Connect to your Git repository
5. Deploy!

### Option B: Deploy via Netlify CLI (if you have Node.js installed)
1. Run: `npm install -g netlify-cli`
2. Run: `netlify deploy`
3. Follow the prompts

---

## Quick Test
Once running with Netlify Dev (Solution 1), the functions should work at:
- http://localhost:8888/.netlify/functions/get-country-list
- http://localhost:8888/.netlify/functions/get-life-expectancy
- http://localhost:8888/.netlify/functions/get-quote

---

## Why This Happens
The `.netlify/functions/` endpoints are only available when running through the Netlify Dev server, which provides the backend infrastructure for serverless functions. A simple HTTP server (like Live Server) can't run these serverless functions.






