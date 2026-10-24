import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function api(path: string, options: RequestInit = {}) {
  const result = await supabase.auth.getSession();
  const accessToken = result.data.session?.access_token;

  const response = await fetch(`${API_URL}${path}`, 
    { ...options, 
      headers: accessToken ? { 
        Authorization: `Bearer ${accessToken}`
      } : {}
    }
  );
  
  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.message);
  }
  return await response.json();
}