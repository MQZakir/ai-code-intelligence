import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugkcvnpbyxgpcuvwrwnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVna2N2bnBieXhncGN1dndyd25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTQxMjgsImV4cCI6MjA4NzM3MDEyOH0.Y2ZV1Px-tTwoxUEep8feKbJeLW7uUKBs5ZiClGSTohU';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVna2N2bnBieXhncGN1dndyd25mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc5NDEyOCwiZXhwIjoyMDg3MzcwMTI4fQ.XGxvE-JLnSCss5bjicv6upPnPHofP6RFpy2NcrmMhMs';

// Create two clients - one for public operations and one for admin operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  experience_level: string;
}

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  experience_level: string
): Promise<{ user: UserProfile | null; error: Error | null }> => {
  try {
    // 1. Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          experience_level: experience_level
        }
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user data returned from sign up');
    }

    // 2. Create the user profile in the users table using the admin client
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: authData.user.id,
          name,
          email,
          experience_level,
        },
      ])
      .select()
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      // If profile creation fails, we should delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return { user: profileData, error: null };
  } catch (error) {
    console.error('Registration error:', error);
    return { user: null, error: error as Error };
  }
}; 