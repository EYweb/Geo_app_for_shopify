import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Stack,
  Heading,
  DataTable,
  EmptyState,
  Badge,
  ProgressBar,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { db, COLLECTIONS } from "../config/firebase";
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  
  try {
    // Fetch user's token balance and subscription
    const userDocRef = doc(db, COLLECTIONS.USERS, shop);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : { tokens_remaining: 0, subscription_plan: 'free' };

    // Fetch all articles for this shop
    const articlesQuery = query(
      collection(db, COLLECTIONS.ARTICLES),
      where('shop_domain', '==', shop)
    );
    const articlesSnapshot = await getDocs(articlesQuery);
    const articles = articlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate analytics
    const totalPosts = articles.length;
    const publishedPosts = articles.filter((article: any) => article.status === 'published').length;
    const draftPosts = articles.filter((article: any) => article.status === 'draft').length;
    const generatedPosts = articles.filter((article: any) => article.status === 'generated').length;

    // Calculate token usage
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
    const tokensUsed = tokenLimit - userData.tokens_remaining;
    const usagePercentage = (tokensUsed / tokenLimit) * 100;

    return json({ 
      userData,
      analytics: {
        totalPosts,
        publishedPosts,
        draftPosts,
        generatedPosts,
        tokensUsed,
        tokenLimit,
        usagePercentage
      },
      articles: articles.slice(0, 10) // Show last 10 articles
    });
  } catch (error) {
    console.error('Error loading analytics:', error);
    return json({ 
      userData: { tokens_remaining: 0, subscription_plan: 'free' },
      analytics: {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        generatedPosts: 0,
        tokensUsed: 0,
        tokenLimit: 7,
        usagePercentage: 0
      },
      articles: []
    });
  }
};

export default function Analytics() {
  const { userData, analytics, articles } = useLoaderData<typeof loader>();

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'free': return 'Free Plan';
      case 'creator': return 'Creator Plan';
      case 'business': return 'Business Plan';
      case 'enterprise': return 'Enterprise Plan';
      default: return 'Free Plan';
    }
  };

  return (
    <Page
      title="Analytics"
      subtitle="Track your content performance and usage"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <Layout>
        {/* Overview Cards */}
        <Layout.Section>
          <Card>
            <Stack distribution="equalSpacing" alignment="center">
              <Stack vertical spacing="tight">
                <Heading>Content Overview</Heading>
                <Text as="p" variant="bodyMd">
                  Track your blog content performance and usage statistics
                </Text>
              </Stack>
              <Stack vertical spacing="tight" alignment="trailing">
                <Text variant="headingMd" as="h3">
                  {getPlanDisplayName(userData.subscription_plan)}
                </Text>
                <Text as="p" variant="bodyMd">
                  {userData.tokens_remaining} tokens remaining
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Statistics Cards */}
        <Layout.Section>
          <Layout>
            <Layout.Section oneThird>
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Text variant="headingMd" as="h3">Total Posts</Text>
                  <Text variant="headingLg" as="h2">{analytics.totalPosts}</Text>
                  <Text variant="bodySm" color="subdued">All generated content</Text>
                </Stack>
              </Card>
            </Layout.Section>

            <Layout.Section oneThird>
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Text variant="headingMd" as="h3">Published</Text>
                  <Text variant="headingLg" as="h2">{analytics.publishedPosts}</Text>
                  <Text variant="bodySm" color="subdued">Live on your blog</Text>
                </Stack>
              </Card>
            </Layout.Section>

            <Layout.Section oneThird>
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Text variant="headingMd" as="h3">Drafts</Text>
                  <Text variant="headingLg" as="h2">{analytics.draftPosts}</Text>
                  <Text variant="bodySm" color="subdued">Saved for later</Text>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        {/* Token Usage */}
        <Layout.Section>
          <Card title="Token Usage">
            <Stack vertical spacing="loose">
              <Stack distribution="equalSpacing">
                <Text variant="bodyMd">Usage Progress</Text>
                <Text variant="bodyMd">{analytics.tokensUsed} of {analytics.tokenLimit} tokens used</Text>
              </Stack>
              <ProgressBar 
                progress={analytics.usagePercentage} 
                size="small"
                color={analytics.usagePercentage > 80 ? "critical" : "success"}
              />
              <Text variant="bodySm" color="subdued">
                {analytics.usagePercentage.toFixed(1)}% of your plan's token limit used
              </Text>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Recent Articles */}
        <Layout.Section>
          <Card title="Recent Articles">
            {articles.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "text", "text", "text"]}
                headings={["Title", "Status", "Generated", "Actions"]}
                rows={articles.map((article: any) => [
                  article.title,
                  <Badge 
                    status={
                      article.status === 'published' ? 'success' : 
                      article.status === 'draft' ? 'warning' : 'info'
                    }
                  >
                    {article.status === 'published' ? 'Published' : 
                     article.status === 'draft' ? 'Draft' : 'Generated'}
                  </Badge>,
                  new Date(article.created_at?.toDate?.() || article.created_at).toLocaleDateString(),
                  article.status === 'published' ? "View" : "Edit"
                ])}
              />
            ) : (
              <EmptyState
                heading="No articles yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Start generating content to see your analytics here.</p>
              </EmptyState>
            )}
          </Card>
        </Layout.Section>

        {/* Performance Insights */}
        <Layout.Section secondary>
          <Card title="Performance Insights">
            <Stack vertical spacing="loose">
              <Stack vertical spacing="tight">
                <Text variant="headingMd" as="h3">Content Generation</Text>
                <Text variant="bodyMd">
                  You've generated {analytics.totalPosts} articles so far.
                </Text>
              </Stack>
              
              <Stack vertical spacing="tight">
                <Text variant="headingMd" as="h3">Publishing Rate</Text>
                <Text variant="bodyMd">
                  {analytics.totalPosts > 0 
                    ? `${((analytics.publishedPosts / analytics.totalPosts) * 100).toFixed(1)}% of your content is published`
                    : 'No content generated yet'
                  }
                </Text>
              </Stack>

              <Stack vertical spacing="tight">
                <Text variant="headingMd" as="h3">Token Efficiency</Text>
                <Text variant="bodyMd">
                  {analytics.tokensUsed > 0 
                    ? `Average ${(analytics.totalPosts / analytics.tokensUsed).toFixed(1)} posts per token`
                    : 'No tokens used yet'
                  }
                </Text>
              </Stack>
            </Stack>
          </Card>

          {/* Upgrade Card */}
          {userData.subscription_plan === 'free' && (
            <Card title="Upgrade Your Plan">
              <Stack vertical spacing="loose">
                <Text variant="bodyMd">
                  Get more tokens and advanced features to scale your content creation.
                </Text>
                <Button url="/app/upgrade" primary fullWidth>
                  Upgrade Now
                </Button>
              </Stack>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
