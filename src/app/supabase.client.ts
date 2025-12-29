import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments';

export const supabase = createClient(
  environment.supabaseUrl,
  environment.supabaseAnonKey
);


// Currently not used directly by Angular.
// Backend (.NET) handles DB communication.
