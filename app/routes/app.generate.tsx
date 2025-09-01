import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  Stack,
  Heading,
  TextField,
  Select,
  ChoiceList,
  Banner,
  Spinner,
  Modal,
  Thumbnail,
  Badge,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import { db, COLLECTIONS } from "../config/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyBvLSVFc0T8v7PsSS70EqTwKwjqR3QCPhQ");

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  
  try {
    // Fetch user's token balance
    const userDocRef = doc(db, COLLECTIONS.USERS, shop);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : { tokens_remaining: 0, subscription_plan: 'free' };

    return json({ 
      userData: userData || { tokens_remaining: 0, subscription_plan: 'free' },
      shop
    });
  } catch (error) {
    console.error('Error loading data:', error);
    return json({ 
      userData: { tokens_remaining: 0, subscription_plan: 'free' },
      shop
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  
  const mainTopic = formData.get("mainTopic") as string;
  const keywords = formData.get("keywords") as string;
  const tone = formData.get("tone") as string;
  const audience = formData.get("audience") as string;
  const length = formData.get("length") as string;
  const numberOfPosts = parseInt(formData.get("numberOfPosts") as string);
  const language = formData.get("language") as string;

  try {
    // Check token balance
    const userDocRef = doc(db, COLLECTIONS.USERS, shop);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : { tokens_remaining: 0, subscription_plan: 'free' };

    if (userData.tokens_remaining < numberOfPosts) {
      return json({ 
        error: `Insufficient tokens. You have ${userData.tokens_remaining} tokens but need ${numberOfPosts} for this request.` 
      });
    }

    // Generate content using Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Create ${numberOfPosts} SEO and AI search optimized blog post${numberOfPosts > 1 ? 's' : ''} about "${mainTopic}".

Requirements:
- Tone: ${tone}
- Target audience: ${audience}
- Length: ${length} (${length === 'short' ? '~500 words' : length === 'medium' ? '~1000 words' : '~2000 words'})
- Language: ${language}
- Keywords to include: ${keywords}
- Optimize for both Google SEO and AI search engines (ChatGPT, Perplexity, Gemini, Claude)
- Include H2 and H3 headings
- Add call-to-action suggestions
- Include Q&A snippets within the content
- Create engaging, valuable content

For each post, provide:
1. SEO-optimized title
2. Meta description
3. Full blog content with proper structure
4. Suggested featured image description

Format the response as JSON with this structure:
{
  "posts": [
    {
      "title": "SEO optimized title",
      "metaDescription": "SEO meta description",
      "content": "Full blog content with H2/H3 headings",
      "imageDescription": "Description for featured image"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    let generatedPosts;
    try {
      generatedPosts = JSON.parse(text);
    } catch (e) {
      // If JSON parsing fails, create a fallback structure
      generatedPosts = {
        posts: [{
          title: mainTopic,
          metaDescription: `Learn about ${mainTopic}`,
          content: text,
          imageDescription: `Image related to ${mainTopic}`
        }]
      };
    }

    // Get images from Pexels
    const pexelsApiKey = process.env.PEXELS_API_KEY || "4WV7SYurfrb76K2GpbN9az26I6LymnRtr4h7lp0RU6i3N6nRXvg2Qfa8";
    const imagePromises = generatedPosts.posts.map(async (post: any) => {
      try {
        const imageResponse = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(post.imageDescription)}&per_page=1`,
          {
            headers: {
              Authorization: pexelsApiKey
            }
          }
        );
        const imageData = await imageResponse.json();
        return imageData.photos?.[0]?.src?.medium || null;
      } catch (error) {
        console.error('Error fetching image:', error);
        return null;
      }
    });

    const images = await Promise.all(imagePromises);

    // Add images to posts
    const postsWithImages = generatedPosts.posts.map((post: any, index: number) => ({
      ...post,
      imageUrl: images[index]
    }));

    // Deduct tokens
    await updateDoc(userDocRef, {
      tokens_remaining: userData.tokens_remaining - numberOfPosts
    });

    // Save generated posts to database
    const savedPosts = [];
    for (const post of postsWithImages) {
      const postData = {
        shop_domain: shop,
        title: post.title,
        meta_description: post.metaDescription,
        content: post.content,
        image_url: post.imageUrl,
        status: 'generated', // generated, draft, published
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTIONS.ARTICLES), postData);
      savedPosts.push({ id: docRef.id, ...postData });
    }

    return json({ 
      success: true, 
      posts: savedPosts,
      tokensUsed: numberOfPosts,
      remainingTokens: userData.tokens_remaining - numberOfPosts
    });

  } catch (error) {
    console.error('Error generating content:', error);
    return json({ error: 'Failed to generate content. Please try again.' });
  }
};

export default function Generate() {
  const { userData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isGenerating = navigation.state === "submitting";

  const [tone, setTone] = useState("professional");
  const [audience, setAudience] = useState("");
  const [length, setLength] = useState("medium");
  const [numberOfPosts, setNumberOfPosts] = useState("1");
  const [language, setLanguage] = useState("English");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const toneOptions = [
    { label: "Professional", value: "professional" },
    { label: "Casual", value: "casual" },
    { label: "Persuasive", value: "persuasive" },
    { label: "Fun", value: "fun" }
  ];

  const lengthOptions = [
    { label: "Short (~500 words)", value: "short" },
    { label: "Medium (~1000 words)", value: "medium" },
    { label: "Long (~2000 words)", value: "long" }
  ];

  const languageOptions = [
    { label: "English", value: "English" },
    { label: "Spanish", value: "Spanish" },
    { label: "French", value: "French" },
    { label: "German", value: "German" },
    { label: "Italian", value: "Italian" }
  ];

  const numberOfPostsOptions = Array.from({ length: 10 }, (_, i) => ({
    label: `${i + 1} post${i > 0 ? 's' : ''}`,
    value: (i + 1).toString()
  }));

  const handlePreview = useCallback((post: any) => {
    setSelectedPost(post);
    setShowPreview(true);
  }, []);

  const handlePublish = useCallback(async (post: any, publishType: 'visible' | 'hidden') => {
    // TODO: Implement Shopify blog publishing
    console.log('Publishing post:', post, 'Type:', publishType);
    setShowPreview(false);
  }, []);

  return (
    <Page
      title="Generate Blog Content"
      subtitle="Create SEO + AI Search optimized blog posts"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Stack vertical spacing="loose">
              <Heading>Content Generation Form</Heading>
              
              {actionData?.error && (
                <Banner status="critical">
                  <p>{actionData.error}</p>
                </Banner>
              )}

              {actionData?.success && (
                <Banner status="success">
                  <p>Successfully generated {actionData.posts.length} post(s)! Used {actionData.tokensUsed} tokens. {actionData.remainingTokens} tokens remaining.</p>
                </Banner>
              )}

              <Form method="post">
                <Stack vertical spacing="loose">
                  <TextField
                    label="Main Topic"
                    name="mainTopic"
                    placeholder="e.g., Sustainable Fashion Trends 2024"
                    required
                    helpText="The primary subject of your blog post"
                  />

                  <TextField
                    label="Keywords (optional)"
                    name="keywords"
                    placeholder="sustainable fashion, eco-friendly, trends, 2024"
                    helpText="Up to 100 keywords separated by commas"
                  />

                  <Select
                    label="Tone of Voice"
                    name="tone"
                    options={toneOptions}
                    value={tone}
                    onChange={setTone}
                    helpText="The writing style and tone for your content"
                  />

                  <TextField
                    label="Target Audience"
                    name="audience"
                    placeholder="e.g., eco-conscious shoppers, fashion enthusiasts"
                    value={audience}
                    onChange={setAudience}
                    helpText="Who is your target audience?"
                  />

                  <Select
                    label="Content Length"
                    name="length"
                    options={lengthOptions}
                    value={length}
                    onChange={setLength}
                    helpText="Choose the desired length of your blog post"
                  />

                  <Select
                    label="Number of Posts to Generate"
                    name="numberOfPosts"
                    options={numberOfPostsOptions}
                    value={numberOfPosts}
                    onChange={setNumberOfPosts}
                    helpText={`You have ${userData.tokens_remaining} tokens remaining`}
                  />

                  <Select
                    label="Language"
                    name="language"
                    options={languageOptions}
                    value={language}
                    onChange={setLanguage}
                    helpText="Select the language for your content"
                  />

                  <Button
                    submit
                    primary
                    loading={isGenerating}
                    disabled={userData.tokens_remaining < parseInt(numberOfPosts)}
                  >
                    {isGenerating ? "Generating..." : `Generate ${numberOfPosts} Post${parseInt(numberOfPosts) > 1 ? 's' : ''}`}
                  </Button>
                </Stack>
              </Form>
            </Stack>
          </Card>
        </Layout.Section>

        {actionData?.success && (
          <Layout.Section>
            <Card title="Generated Posts">
              <Stack vertical spacing="loose">
                {actionData.posts.map((post: any, index: number) => (
                  <Card key={post.id} sectioned>
                    <Stack vertical spacing="tight">
                      <Stack distribution="equalSpacing" alignment="center">
                        <Heading>{post.title}</Heading>
                        <Badge status="success">Generated</Badge>
                      </Stack>
                      
                      {post.image_url && (
                        <Thumbnail
                          source={post.image_url}
                          alt={post.title}
                          size="large"
                        />
                      )}
                      
                      <Text variant="bodyMd" color="subdued">
                        {post.meta_description}
                      </Text>
                      
                      <Stack>
                        <Button onClick={() => handlePreview(post)}>
                          Preview
                        </Button>
                        <Button onClick={() => handlePublish(post, 'visible')} primary>
                          Publish Now
                        </Button>
                        <Button onClick={() => handlePublish(post, 'hidden')}>
                          Save as Draft
                        </Button>
                      </Stack>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Card>
          </Layout.Section>
        )}
      </Layout>

      {/* Preview Modal */}
      <Modal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title={selectedPost?.title}
        primaryAction={{
          content: "Publish Now",
          onAction: () => handlePublish(selectedPost, 'visible'),
        }}
        secondaryActions={[
          {
            content: "Save as Draft",
            onAction: () => handlePublish(selectedPost, 'hidden'),
          },
        ]}
        large
      >
        <Modal.Section>
          {selectedPost?.image_url && (
            <div style={{ marginBottom: '1rem' }}>
              <Thumbnail
                source={selectedPost.image_url}
                alt={selectedPost.title}
                size="large"
              />
            </div>
          )}
          <div 
            dangerouslySetInnerHTML={{ 
              __html: selectedPost?.content?.replace(/\n/g, '<br>') || '' 
            }} 
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
}
