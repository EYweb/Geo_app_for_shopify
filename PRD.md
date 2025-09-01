# PRD: AI Blog & Content Generator for Shopify

## 1. Overview
The AI Blog & Content Generator is a Shopify app that helps merchants automatically generate SEO + AI Search (GEO) optimized blog posts.
Unlike generic AI writers, this app ensures content is optimized for Google SEO and for AI-driven search engines (ChatGPT, Perplexity, Gemini, Claude, etc.).

It enables merchants to maintain a consistent, discoverable blog that drives organic traffic with minimal effort.

## 2. Goals
- Automate blog post creation for Shopify stores.
- Ensure posts are optimized for SEO + AI Search discoverability.
- Provide a simple, token-based usage model.
- Monetize with scalable pricing tiers.
- Allow merchants to preview, Publish Post Immediately to Shopify Blog and Save as Draft in Shopify Blog (recommended if merchant wants to edit the post).

## 3. Target Users
- Small to medium Shopify merchants without dedicated marketing teams.
- DTC brands wanting to grow organic visibility.
- Marketers seeking to reduce time spent on content creation.

## 4. User Flow

### Step 1: Open App
- Accessible from Shopify Admin → Apps > AI Blog Generator.

### Step 2: Fill Out Content Form
**Fields:**
- **Main Topic** (required)
- **Keywords** (optional): Up to 100 keywords.
- **Preferences** (optional):
  - Tone of voice (professional, casual, persuasive, fun)
  - Audience (pet owners, eco-conscious shoppers, etc.)
  - Length (short: ~500 words, medium: ~1000 words, long: ~2000 words)
  - Amount of Posts to Generate: Between 1 and 10.
  - Language: English (default), multi-language - option to select

### Step 3: Generate Content
AI generates for each post:
- Blog title (SEO + GEO optimized).
- Blog body (structured with H2/H3 headings, CTA suggestions, keyword density).
- Featured stock image (via Pexels API).
- SEO metadata (title tag, description).
- Q&A snippets included in article.

### Step 4: Preview & Edit
- **Preview Modal**: Merchant can view the generated post in a modal.
- **Regenerate Variations**: Option to generate alternative drafts.
- **Edit post → via hidden (draft) only**:
  - No in-app editing.
  - If editing is needed → merchant saves the post as a hidden (draft).
  - Editing is done in Shopify Blog Hidden (draft) native editor.

### Step 5: Visible / Hidden (Publish / Draft) Options
- **Visible** - Publish Post Immediately to Shopify Blog.
- **Hidden** - Save as Draft in Shopify Blog (recommended if merchant wants to edit text).

### Step 6: Success Modal
After publishing, merchant sees:
- 🎉 "Your Blog Post is Live on Your Site!"
- CTA → Rate Us on Shopify App Store.
- Thank-you message for being part of our journey
- If the user saves a draft send him to the drafts page on shopify

## 5. Features

### Core Features
- **AI Content Generation** (SEO + GEO optimized).
- **AI Search Intent Analysis**: Suggests real audience questions for alignment with AI summaries.
- **Stock Images Integration** (Pexels API).
- **Direct Shopify Blog Publishing** (make it visible or hidden - publish now or save as draft).

## 6. Pricing & Plans
- **Free Plan** → 7 tokens (one time - no renewal).
- **Creator Plan** → 25 tokens / $7. (Scheduler included)
- **Business Plan** → 100 tokens / $20.
- **Enterprise Plan** → 1000 tokens / $100.
- Extra tokens are purchasable anytime.

## 7. Technical Requirements
- **Frontend**: React with Shopify Polaris UI components.
- **Backend**: Node.js (Express) or Bolt runtime.
- **Database**: Supabase
- **APIs**:
  - Gemini → text generation.
  - Pexels → stock images.
  - Shopify Admin API → blog publishing, drafts, scheduler.
- **Hosting**: Netlify - This is what we did until now, but if you have any other preferences, let us know.

## 8. Success Metrics
- User engagement with generated content
- Organic traffic growth
- Content publishing frequency
- User retention and plan upgrades
- App store ratings and reviews

## 9. Future Enhancements
- Advanced analytics dashboard
- Content performance tracking
- A/B testing for content variations
- Integration with social media platforms
- Multi-language content generation
- Advanced SEO optimization tools







