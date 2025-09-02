import { supabase } from './supabaseClient.js';

const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const logoutButton = document.getElementById('logout-button');
const authForm = document.getElementById('auth-form');
const authMessage = document.getElementById('auth-message');

// Funkcja do przełączania widoku (zalogowany / niezalogowany)
function toggleView(user) {
    if (user) {
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
    } else {
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
    }
}

// Sprawdzanie sesji użytkownika przy starcie
supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user;
    toggleView(user);
});


// Logika formularza logowania / rejestracji
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    let { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        // Jeśli logowanie się nie powiedzie, spróbuj zarejestrować
        let { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
            authMessage.textContent = signUpError.message;
        } else {
            authMessage.textContent = 'Sprawdź email, aby potwierdzić rejestrację!';
        }
    }
});

// Logika wylogowania
logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
});

// Eksportujemy, żeby inne pliki wiedziały co robić
export { toggleView };