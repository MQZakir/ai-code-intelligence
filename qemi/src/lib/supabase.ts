import { createClient } from '@supabase/supabase-js';

// Please add your supabase credentials
const supabaseUrl = '--';
const supabaseAnonKey = '--';
const supabaseServiceKey = '--';

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
