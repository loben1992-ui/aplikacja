// Ten plik JEST WERSJONOWANY w Git.
// Nigdy nie wklejaj tu kluczy na stałe!
// Użyj zmiennych środowiskowych w Vercel.

// Te nazwy zmiennych (VITE_...) są standardem, który Vercel rozpozna.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Jeśli zmienne nie są dostępne (np. lokalnie bez konfiguracji), użyj pustych wartości.
// Aplikacja po prostu nie połączy się z bazą.
export const supabase = supabase.createClient(supabaseUrl || "", supabaseKey || "");
