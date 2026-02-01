'use server';

import { createClient } from '@/lib/supabase';
import type { AuthUser } from '@/lib/client/api';

export async function signInUser(
  email: string,
  password: string,
): Promise<AuthUser> {
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Fetch user from profiles table
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', data.user.id)
    .single();

  if (userError) throw userError;

  return {
    id: userData.auth_id,
    email: userData.email,
    name: userData.full_name,
    avatar_url: userData.avatar_url,
    role: userData.role,
    created_at: userData.created_at,
  };
}

export async function signUpUser(
  email: string,
  password: string,
  name: string,
): Promise<AuthUser> {
  const supabase = await createClient();

  // Sign up with user metadata
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        display_name: name,
      },
    },
  });

  if (error) throw error;

  if (!data.user) throw new Error('Failed to create user');

  // Wait a moment for the trigger to create the profile
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Fetch the auto-created profile
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', data.user.id)
    .single();

  if (userError) {
    // If profile not found, create it manually
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        auth_id: data.user.id,
        email,
        full_name: name,
        role: 'user',
      })
      .select()
      .single();

    if (createError) throw createError;

    return {
      id: newProfile.auth_id,
      email: newProfile.email,
      name: newProfile.full_name,
      avatar_url: newProfile.avatar_url,
      role: newProfile.role,
      created_at: newProfile.created_at,
    };
  }

  return {
    id: userData.auth_id,
    email: userData.email,
    name: userData.full_name,
    avatar_url: userData.avatar_url,
    role: userData.role,
    created_at: userData.created_at,
  };
}

export async function signOutUser(): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) return null;

  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', authUser.id)
    .single();

  if (userError) return null;

  return {
    id: userData.auth_id,
    email: userData.email,
    name: userData.full_name,
    avatar_url: userData.avatar_url,
    role: userData.role,
    created_at: userData.created_at,
  };
}
