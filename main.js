import { supabase } from './supabaseClient.js';

// --- STAN APLIKACJI ---
let editState = { isEditing: false, id: null, type: null }; // Śledzi, czy edytujemy klienta czy zlecenie
let currentModal = { orderId: null }; // Przechowuje ID zlecenia otwartego w modalu

// --- ELEMENTY DOM ---
const clientsList = document.getElementById('clients-list');
const ordersList = document.getElementById('orders-list');
const clientForm = document.getElementById('client-form');
const orderForm = document.getElementById('order-form');
const orderClientSelect = document.getElementById('order-client');
const searchClientInput = document.getElementById('search-client');
const modal = document.getElementById('details-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalCloseBtn = document.querySelector('.modal-close-button');
const tasksList = document.getElementById('modal-tasks-list');
const addTaskForm = document.getElementById('add-task-form');
const attachmentsList = document.getElementById('modal-attachments-list');
const uploadAttachmentForm = document.getElementById('upload-attachment-form');
let calendar; // Zmienna do przechowywania instancji kalendarza

// --- GŁÓWNA FUNKCJA INICJALIZUJĄCA ---
export async function initializeApp() {
    await Promise.all([
        fetchAndDisplayClients(),
        fetchAndDisplayOrders()
    ]);
    initializeCalendar();
    generateReports();
    setupEventListeners();
}

// --- FUNKCJE POBIERAJĄCE I WYŚWIETLAJĄCE DANE ---

async function fetchAndDisplayClients(searchTerm = '') {
    let query = supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`); // Wyszukiwanie bez względu na wielkość liter
    }
    const { data: clients, error } = await query;
    if (error) return console.error('Błąd pobierania klientów:', error);

    clientsList.innerHTML = '';
    orderClientSelect.innerHTML = '<option value="">-- Wybierz klienta --</option>';
    clients.forEach(client => {
        clientsList.innerHTML += `
            <li data-id="${client.id}" data-type="client">
                <span>${client.name} (${client.email})</span>
                <div class="button-group">
                    <button class="action-button edit-btn" data-id="${client.id}" data-type="client">Edytuj</button>
                    <button class="action-button delete-btn" data-id="${client.id}" data-type="client">Usuń</button>
                </div>
            </li>`;
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        orderClientSelect.appendChild(option);
    });
}

async function fetchAndDisplayOrders() {
    const { data: orders, error } = await supabase.from('orders').select('*, clients(name)').order('created_at', { ascending: false });
    if (error) return console.error('Błąd pobierania zleceń:', error);
    
    ordersList.innerHTML = '';
    orders.forEach(order => {
        ordersList.innerHTML += `
            <li data-id="${order.id}" data-type="order">
                <span>${order.title} - Klient: ${order.clients.name}</span>
                <div class="button-group">
                    <button class="action-button edit-btn" data-id="${order.id}" data-type="order">Edytuj</button>
                    <button class="action-button delete-btn" data-id="${order.id}" data-type="order">Usuń</button>
                </div>
            </li>`;
    });
}

// --- LOGIKA EDYCJI, USUWANIA, DODAWANIA ---

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formId = form.id;
    const isClientForm = formId === 'client-form';
    const tableName = isClientForm ? 'clients' : 'orders';

    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
        if (value) data[key] = value;
    }
    delete data.id;

    if (formId === 'order-form' && !data.client_id) {
        alert("Proszę wybrać klienta dla zlecenia!");
        return; // Zakończ działanie funkcji
    }

    let error;
    if (editState.isEditing && editState.type === (isClientForm ? 'client' : 'order')) {
        // Tryb edycji
        const { error: updateError } = await supabase.from(tableName).update(data).eq('id', editState.id);
        error = updateError;
    } else {
        // Tryb dodawania
        const { error: insertError } = await supabase.from(tableName).insert(data);
        error = insertError;
    }

    // POPRAWIONA LOGIKA: Sprawdzamy, czy wystąpił błąd
    if (error) {
        console.error(`Błąd operacji na '${tableName}':`, error);
        alert(`Błąd: ${error.message}`);
        return; // **WAŻNE: Zakończ działanie funkcji, jeśli był błąd!**
    }
    
    // Ta część wykona się tylko, jeśli NIE było błędu
    resetForm(formId);
    await (isClientForm ? fetchAndDisplayClients() : fetchAndDisplayOrders());
    await refreshCalendarAndReports();
}

async function handleDelete(id, type) {
    if (!confirm('Czy na pewno chcesz usunąć ten element?')) return;
    const tableName = type === 'client' ? 'clients' : 'orders';
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) alert('Błąd usuwania: ' + error.message);
    
    await (type === 'client' ? fetchAndDisplayClients() : fetchAndDisplayOrders());
    await refreshCalendarAndReports();
}

async function handleEdit(id, type) {
    const tableName = type === 'client' ? 'clients' : 'orders';
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (error) return alert('Nie można załadować danych do edycji: ' + error.message);

    editState = { isEditing: true, id, type };

    if (type === 'client') {
        document.getElementById('client-form-title').textContent = 'Edytuj Klienta';
        document.getElementById('client-id').value = data.id;
        document.getElementById('client-name').value = data.name || '';
        document.getElementById('client-email').value = data.email || '';
        document.getElementById('client-phone').value = data.phone || '';
        document.getElementById('client-nip').value = data.nip || '';
        document.getElementById('client-submit-button').textContent = 'Zapisz zmiany';
        document.getElementById('client-cancel-button').classList.remove('hidden');
    } else {
        document.getElementById('order-form-title').textContent = 'Edytuj Zlecenie';
        document.getElementById('order-id').value = data.id;
        document.getElementById('order-title').value = data.title || '';
        document.getElementById('order-client').value = data.client_id || '';
        document.getElementById('order-value').value = data.value || '';
        document.getElementById('order-deadline').value = data.deadline || '';
        document.getElementById('order-status').value = data.status || 'Nowe';
        document.getElementById('order-submit-button').textContent = 'Zapisz zmiany';
        document.getElementById('order-cancel-button').classList.remove('hidden');
    }
}

function resetForm(formId) {
    document.getElementById(formId).reset();
    editState = { isEditing: false, id: null, type: null };
    if (formId === 'client-form') {
        document.getElementById('client-form-title').textContent = 'Dodaj Nowego Klienta';
        document.getElementById('client-submit-button').textContent = 'Dodaj Klienta';
        document.getElementById('client-cancel-button').classList.add('hidden');
    } else {
        document.getElementById('order-form-title').textContent = 'Dodaj Nowe Zlecenie';
        document.getElementById('order-submit-button').textContent = 'Dodaj Zlecenie';
        document.getElementById('order-cancel-button').classList.add('hidden');
    }
}

// --- LOGIKA OKNA MODALNEGO (SZCZEGÓŁÓW) ---

async function showDetails(id, type) {
    const subInfo = document.getElementById('modal-sub-info');
    if (type === 'client') {
        const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
        if (error) return;
        modalTitle.textContent = 'Szczegóły Klienta';
        subInfo.classList.add('hidden');
        modalBody.innerHTML = `
            <p><strong>Nazwa:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Telefon:</strong> ${data.phone || 'Brak'}</p>
            <p><strong>NIP:</strong> ${data.nip || 'Brak'}</p>`;
    } else {
        currentModal.orderId = id;
        const { data, error } = await supabase.from('orders').select('*, clients(name)').eq('id', id).single();
        if (error) return;
        modalTitle.textContent = 'Szczegóły Zlecenia';
        subInfo.classList.remove('hidden');
        modalBody.innerHTML = `
            <p><strong>Tytuł:</strong> ${data.title}</p>
            <p><strong>Klient:</strong> ${data.clients.name}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><strong>Wartość:</strong> ${data.value ? data.value + ' PLN' : 'Nie podano'}</p>
            <p><strong>Termin:</strong> ${data.deadline || 'Nie podano'}</p>`;
        await renderTasks(id);
        await renderAttachments(id);
    }
    modal.classList.remove('hidden');
}

// --- LOGIKA ZADAŃ (TASKS) ---

async function renderTasks(orderId) {
    const { data, error } = await supabase.from('tasks').select('*').eq('order_id', orderId).order('created_at');
    if (error) return console.error('Błąd pobierania zadań:', error);
    tasksList.innerHTML = '';
    data.forEach(task => {
        tasksList.innerHTML += `
            <li class="${task.is_completed ? 'task-completed' : ''}">
                <label>
                    <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.is_completed ? 'checked' : ''}>
                    <span>${task.description}</span>
                </label>
                <button class="action-button delete-btn delete-task-btn" data-id="${task.id}">&times;</button>
            </li>`;
    });
}

async function handleAddTask(e) {
    e.preventDefault();
    const description = document.getElementById('new-task-description').value;
    if (!description || !currentModal.orderId) return;
    await supabase.from('tasks').insert({ order_id: currentModal.orderId, description });
    addTaskForm.reset();
    await renderTasks(currentModal.orderId);
}

async function handleToggleTask(taskId, isCompleted) {
    await supabase.from('tasks').update({ is_completed: isCompleted }).eq('id', taskId);
    await renderTasks(currentModal.orderId);
}

async function handleDeleteTask(taskId) {
    await supabase.from('tasks').delete().eq('id', taskId);
    await renderTasks(currentModal.orderId);
}

// --- LOGIKA ZAŁĄCZNIKÓW (ATTACHMENTS) ---

async function renderAttachments(orderId) {
    const { data, error } = await supabase.from('attachments').select('*').eq('order_id', orderId);
    if (error) return console.error('Błąd pobierania załączników:', error);
    attachmentsList.innerHTML = '';
    data.forEach(file => {
        const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(file.file_path);
        attachmentsList.innerHTML += `
            <li>
                <a href="${publicUrl}" target="_blank" rel="noopener noreferrer">${file.file_name}</a>
                <button class="action-button delete-btn delete-attachment-btn" data-id="${file.id}" data-path="${file.file_path}">&times;</button>
            </li>`;
    });
}

async function handleFileUpload(e) {
    e.preventDefault();
    const file = document.getElementById('new-attachment-file').files[0];
    if (!file || !currentModal.orderId) return;
    const filePath = `public/${currentModal.orderId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file);
    if (uploadError) return alert('Błąd wgrywania pliku: ' + uploadError.message);
    await supabase.from('attachments').insert({
        order_id: currentModal.orderId, file_name: file.name, file_path: filePath, file_size: file.size, mime_type: file.type
    });
    uploadAttachmentForm.reset();
    await renderAttachments(currentModal.orderId);
}

async function handleDeleteAttachment(attachmentId, filePath) {
    if (!confirm('Czy na pewno usunąć ten załącznik?')) return;
    await supabase.storage.from('attachments').remove([filePath]);
    await supabase.from('attachments').delete().eq('id', attachmentId);
    await renderAttachments(currentModal.orderId);
}

// --- LOGIKA KALENDARZA I RAPORTÓW ---

function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' },
        locale: 'pl'
    });
    calendar.render();
    refreshCalendarAndReports();
}

async function generateReports() {
    const { data: clients, error: clientError } = await supabase.from('clients').select('id', { count: 'exact' });
    const { data: orders, error: orderError } = await supabase.from('orders').select('status, value');
    if (clientError || orderError) return;
    const completedOrders = orders.filter(o => o.status === 'Zakończone');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (Number(order.value) || 0), 0);
    document.getElementById('total-clients').textContent = clients.length;
    document.getElementById('completed-orders').textContent = completedOrders.length;
    document.getElementById('total-revenue').textContent = `${totalRevenue.toFixed(2)} PLN`;
}

async function refreshCalendarAndReports() {
    const { data: events, error } = await supabase.from('orders').select('title, deadline').not('deadline', 'is', null);
    if (!error && calendar) {
        calendar.removeAllEvents();
        const formattedEvents = events.map(event => ({ title: event.title, start: event.deadline }));
        calendar.addEventSource(formattedEvents);
    }
    await generateReports();
}

// --- USTAWIENIE NASŁUCHIWANIA ZDARZEŃ ---
function setupEventListeners() {
    clientForm.addEventListener('submit', handleFormSubmit);
    orderForm.addEventListener('submit', handleFormSubmit);
    document.getElementById('client-cancel-button').addEventListener('click', () => resetForm('client-form'));
    document.getElementById('order-cancel-button').addEventListener('click', () => resetForm('order-form'));
    searchClientInput.addEventListener('input', (e) => fetchAndDisplayClients(e.target.value));
    
    // Listenery dla modala
    addTaskForm.addEventListener('submit', handleAddTask);
    uploadAttachmentForm.addEventListener('submit', handleFileUpload);
    modalCloseBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

    // Delegacja zdarzeń dla dynamicznie tworzonych elementów
    document.body.addEventListener('click', e => {
        const target = e.target;
        if (target.matches('.edit-btn')) handleEdit(target.dataset.id, target.dataset.type);
        else if (target.matches('.delete-btn')) handleDelete(target.dataset.id, target.dataset.type);
        else if (target.matches('.delete-task-btn')) handleDeleteTask(target.dataset.id);
        else if (target.matches('.delete-attachment-btn')) handleDeleteAttachment(target.dataset.id, target.dataset.path);
        else if (target.closest('li') && !target.closest('.button-group')) {
            const li = target.closest('li');
            if (li.dataset.id) showDetails(li.dataset.id, li.dataset.type);
        }
    });

    document.body.addEventListener('change', e => {
        if (e.target.matches('.task-checkbox')) handleToggleTask(e.target.dataset.id, e.target.checked);
    });
}
