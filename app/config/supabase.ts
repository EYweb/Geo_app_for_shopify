import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for user operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database tables structure
export const TABLES = {
  USERS: 'users',
  ARTICLES: 'articles',
  TOKENS: 'tokens',
  SUBSCRIPTIONS: 'subscriptions',
  ANALYTICS: 'analytics'
} as const;

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create users table
    await supabaseAdmin.rpc('create_users_table', {});
    
    // Create articles table
    await supabaseAdmin.rpc('create_articles_table', {});
    
    // Create tokens table
    await supabaseAdmin.rpc('create_tokens_table', {});
    
    // Create subscriptions table
    await supabaseAdmin.rpc('create_subscriptions_table', {});
    
    // Create analytics table
    await supabaseAdmin.rpc('create_analytics_table', {});
    
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}


