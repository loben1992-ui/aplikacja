import { supabase } from './supabaseClient.js';
import { initializeApp } from './main.js'; // Importujemy główną funkcję inicjalizującą

const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const logoutButton = document.getElementById('logout-button');
const authForm = document.getElementById('auth-form');
const authMessage = document.getElementById('auth-message');

function toggleView(user) {
    if (user) {
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        initializeApp(); // Uruchom całą aplikację
    } else {
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
    }
}

// Sprawdzanie sesji użytkownika przy starcie
supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
    toggleView(user);
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    authMessage.textContent = '';

    // Spróbuj się zalogować
    let { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        // Jeśli logowanie się nie powiedzie, spróbuj zarejestrować
        let { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
            authMessage.textContent = signUpError.message;
        } else {
            authMessage.textContent = 'Sprawdź email, aby potwierdzić rejestrację!';
        }
    }
});

logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
});
