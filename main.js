import { supabase } from './supabaseClient.js';

// Elementy DOM
const clientsList = document.getElementById('clients-list');
const ordersList = document.getElementById('orders-list');
const clientForm = document.getElementById('client-form');
const orderForm = document.getElementById('order-form');
const orderClientSelect = document.getElementById('order-client');

// --- FUNKCJE WYŚWIETLAJĄCE DANE ---

async function fetchAndDisplayClients() {
    // 1. Pobierz dane z Supabase
    const { data: clients, error } = await supabase.from('clients').select('*');
    if (error) console.error('Błąd pobierania klientów:', error);

    // 2. Wyczyść stare listy
    clientsList.innerHTML = '';
    orderClientSelect.innerHTML = '<option value="">-- Wybierz klienta --</option>';

    // 3. Wypełnij listy nowymi danymi
    clients.forEach(client => {
        // Lista klientów
        const li = document.createElement('li');
        li.textContent = `${client.name} (${client.email})`;
        clientsList.appendChild(li);

        // Opcje w formularzu zlecenia
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        orderClientSelect.appendChild(option);
    });
}

async function fetchAndDisplayOrders() {
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            clients ( name )
        `); // Pobieramy też nazwę klienta!
    if (error) console.error('Błąd pobierania zleceń:', error);

    ordersList.innerHTML = '';
    orders.forEach(order => {
        const li = document.createElement('li');
        li.textContent = `${order.title} - Klient: ${order.clients.name} - Status: ${order.status}`;
        ordersList.appendChild(li);
    });
}

// --- OBSŁUGA FORMULARZY ---

clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('client-name').value;
    const email = document.getElementById('client-email').value;
    const phone = document.getElementById('client-phone').value;

    const { error } = await supabase.from('clients').insert({ name, email, phone });

    if (error) {
        alert('Błąd: ' + error.message);
    } else {
        await fetchAndDisplayClients(); // Odśwież listę
        clientForm.reset();
    }
});

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('order-title').value;
    const client_id = document.getElementById('order-client').value;
    const value = document.getElementById('order-value').value;

    const { error } = await supabase.from('orders').insert({ title, client_id, value });

    if (error) {
        alert('Błąd: ' + error.message);
    } else {
        await fetchAndDisplayOrders(); // Odśwież listę
        orderForm.reset();
    }
});


// Nasłuchuj zmian w stanie autentykacji, aby załadować dane po zalogowaniu
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        fetchAndDisplayClients();
        fetchAndDisplayOrders();
    }
});