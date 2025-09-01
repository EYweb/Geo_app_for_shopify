# AI Blog Content Generator - Setup Guide

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=your_app_url
SCOPES=write_products,read_products,write_script_tags,read_script_tags,write_themes,read_themes,write_articles,read_articles

# AI and Image APIs
GEMINI_API_KEY=AIzaSyBvLSVFc0T8v7PsSS70EqTwKwjqR3QCPhQ
PEXELS_API_KEY=4WV7SYurfrb76K2GpbN9az26I6LymnRtr4h7lp0RU6i3N6nRXvg2Qfa8
```

## Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Add a web app
   - Copy the configuration to your `.env` file
   - Enable Firestore Database

3. **Set up Shopify App**
   - Create a Shopify Partner account
   - Create a new app
   - Copy the API key and secret to your `.env` file
   - Set the app URL to your development URL

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Install App on Store**
   - Visit the URL provided by the CLI
   - Install the app on a development store

## Features Implemented

✅ **Dashboard** - Main app interface with token usage and recent posts
✅ **Content Generation** - AI-powered blog post creation with Gemini
✅ **Image Integration** - Automatic stock images from Pexels
✅ **Token System** - Usage tracking and limits
✅ **Preview System** - Preview generated content before publishing
✅ **Firebase Integration** - Database for storing posts and user data

## Next Steps

- [ ] Implement Shopify Blog publishing
- [ ] Add analytics dashboard
- [ ] Create upgrade flow
- [ ] Add settings page
- [ ] Implement draft management

## Usage

1. Go to the dashboard
2. Click "Generate New Post"
3. Fill out the content form
4. Generate content with AI
5. Preview and publish to your Shopify blog
