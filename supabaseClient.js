// Ten plik JEST WERSJONOWANY w Git.
// Nigdy nie wklejaj tu kluczy na stałe!
// Użyj zmiennych środowiskowych w Vercel.

// Te nazwy zmiennych (VITE_...) są standardem, który Vercel rozpozna.
//const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
//const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrl = 'https://jftfehetoescwacqfmkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdGZlaGV0b2VzY3dhY3FmbWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTM0MTEsImV4cCI6MjA3MjM4OTQxMX0.zeRvIjSD4-_fLDbdfadYN6X-MBOm8-52KcCT4FEru2g';

// Jeśli zmienne nie są dostępne (np. lokalnie bez konfiguracji), użyj pustych wartości.
// Aplikacja po prostu nie połączy się z bazą.
export const supabase = supabase.createClient(supabaseUrl || "", supabaseKey || "");
