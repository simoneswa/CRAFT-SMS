const { createClient } = require('@supabase/supabase-js');

// These keys are directly from your .env.local
const supabaseUrl = 'https://zeiafetgpkoaapnryyhd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWFmZXRncGtvYWFwbnJ5eWhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2OTQyNTgsImV4cCI6MjA5NDI3MDI1OH0.TGU8RdIb68PMnRgEhTqpldN972aZCLShXFsBxabW32c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostic() {
  console.log('--- STARTING LIVE DATABASE DIAGNOSTIC ---');
  
  try {
    // Attempting to select 1 row from the notifications table to see if it exists
    console.log('[*] Testing connection to public.notifications table...');
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);

    if (error) {
      console.log('[-] ERROR ENCOUNTERED:');
      console.log(JSON.stringify(error, null, 2));
      
      if (error.code === 'PGRST205' || error.message.includes('relation "public.notifications" does not exist') || error.code === '404') {
        console.log('\n[!] CONCLUSION: The notifications table DOES NOT EXIST in the public schema.');
        console.log('[!] This is the root cause of the 404 and the crashing behavior.');
      } else {
        console.log('\n[!] CONCLUSION: Table exists but access failed due to RLS or other reasons.');
      }
    } else {
      console.log('[+] SUCCESS: The notifications table exists and is accessible.');
      console.log('Data sample:', data);
    }
  } catch (err) {
    console.log('[-] CRITICAL FETCH ERROR:', err.message);
  }
  
  console.log('--- DIAGNOSTIC COMPLETE ---');
}

runDiagnostic();
