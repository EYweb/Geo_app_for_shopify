import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  Badge,
  BlockBlockStack,
  InlineBlockStack,
  Text as Heading,
  DataTable,
  EmptyState,
  Icon,
  ProgressBar,
} from "@shopify/polaris";
import { PlusIcon, BlogIcon, ViewIcon, SettingsIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { db, COLLECTIONS } from "../config/firebase";
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Get shop domain for database queries
  const shop = session.shop;
  
  try {
    // Fetch user's token balance and subscription
    const userDocRef = doc(db, COLLECTIONS.USERS, shop);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : { tokens_remaining: 0, subscription_plan: 'free' };

    // Fetch recent articles
    const articlesQuery = query(
      collection(db, COLLECTIONS.ARTICLES),
      where('shop_domain', '==', shop),
      orderBy('created_at', 'desc'),
      limit(5)
    );
    const articlesSnapshot = await getDocs(articlesQuery);
    const articles = articlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch Shopify blog articles
    const shopifyArticles = await admin.graphql(`
      query {
        articles(first: 10) {
          edges {
            node {
              id
              title
              handle
              publishedAt
              seo {
                title
                description
              }
            }
          }
        }
      }
    `);

    return json({ 
      userData: userData || { tokens_remaining: 0, subscription_plan: 'free' },
      articles: articles || [],
      shopifyArticles: shopifyArticles.data.articles.edges,
      shop
    });
  } catch (error) {
    console.error('Error loading data:', error);
    return json({ 
      userData: { tokens_remaining: 0, subscription_plan: 'free' },
      articles: [],
      shopifyArticles: [],
      shop
    });
  }
};

export default function Index() {
  const { userData, articles, shopifyArticles, shop } = useLoaderData<typeof loader>();

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'free': return 'Free Plan';
      case 'creator': return 'Creator Plan';
      case 'business': return 'Business Plan';
      case 'enterprise': return 'Enterprise Plan';
      default: return 'Free Plan';
    }
  };

  const getPlanTokenLimit = (plan: string) => {
    switch (plan) {
      case 'free': return 7;
      case 'creator': return 25;
      case 'business': return 100;
      case 'enterprise': return 1000;
      default: return 7;
    }
  };

  const tokenLimit = getPlanTokenLimit(userData.subscription_plan);
  const tokenUsage = tokenLimit - userData.tokens_remaining;
  const usagePercentage = (tokenUsage / tokenLimit) * 100;

  return (
    <Page
      title="AI Blog Content Generator"
      subtitle="Generate SEO + AI Search optimized content for your store"
      primaryAction={{
        content: "Generate New Post",
        icon: PlusIcon,
        url: "/app/generate",
      }}
    >
      <Layout>
        {/* Token Usage Card */}
        <Layout.Section>
          <Card>
            <BlockStack distribution="equalSpacing" alignment="center">
              <BlockStack vertical spacing="tight">
                <Heading>Welcome to AI Blog Generator</Heading>
                <Text as="p" variant="bodyMd">
                  Create SEO and AI search optimized blog posts that drive organic traffic
                </Text>
              </BlockStack>
              <BlockStack vertical spacing="tight" alignment="trailing">
                <Text variant="headingMd" as="h3">
                  {getPlanDisplayName(userData.subscription_plan)}
                </Text>
                <Text as="p" variant="bodyMd">
                  {userData.tokens_remaining} tokens remaining
                </Text>
              </BlockStack>
            </BlockStack>
            
            <div style={{ marginTop: '1rem' }}>
              <BlockStack vertical spacing="tight">
                <Text variant="bodyMd">Token Usage</Text>
                <ProgressBar 
                  progress={usagePercentage} 
                  size="small"
                  color={usagePercentage > 80 ? "critical" : "success"}
                />
                <Text variant="bodySm" color="subdued">
                  {tokenUsage} of {tokenLimit} tokens used
                </Text>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        {/* Recent Articles */}
        <Layout.Section>
          <Card title="Recent Blog Posts">
            {articles.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "text", "text", "text"]}
                headings={["Title", "Status", "Generated", "Actions"]}
                rows={articles.map((article: any) => [
                  article.title,
                  article.published ? "Published" : "Draft",
                  new Date(article.created_at).toLocaleDateString(),
                  article.published ? "View" : "Edit"
                ])}
              />
            ) : (
              <EmptyState
                heading="No blog posts yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Start by generating your first AI-optimized blog post.</p>
              </EmptyState>
            )}
          </Card>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section secondary>
          <Card title="Quick Actions">
            <BlockStack vertical spacing="loose">
              <Button url="/app/generate" icon={PlusIcon} fullWidth>
                Generate New Post
              </Button>
              <Button url="/app/analytics" icon={ViewIcon} fullWidth>
                View Analytics
              </Button>
              <Button url="/app/settings" icon={SettingsIcon} fullWidth>
                App Settings
              </Button>
            </BlockStack>
          </Card>

          {/* Subscription Info */}
          <Card title="Subscription">
            <BlockStack vertical spacing="loose">
              <BlockStack distribution="equalSpacing">
                <Text variant="bodyMd">Current Plan:</Text>
                <Badge status="success">{getPlanDisplayName(userData.subscription_plan)}</Badge>
              </BlockStack>
              <BlockStack distribution="equalSpacing">
                <Text variant="bodyMd">Tokens:</Text>
                <Text variant="bodyMd">{userData.tokens_remaining} remaining</Text>
              </BlockStack>
              {userData.subscription_plan === 'free' && (
                <Button url="/app/upgrade" primary fullWidth>
                  Upgrade Plan
                </Button>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}


