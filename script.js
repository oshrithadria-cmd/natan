// ===== Task Journal Application - Firebase Edition =====

// ============================================================
// FIREBASE CONFIG - PASTE YOUR CONFIG HERE
// Go to https://console.firebase.google.com → Create project →
// Build → Realtime Database → Create (test mode) →
// Project Settings → Add web app → Copy config
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyAOOday74nCyk27wF4CxlKmU3eVuMxQ8mA",
    authDomain: "natan-tasks.firebaseapp.com",
    databaseURL: "https://natan-tasks-default-rtdb.firebaseio.com",
    projectId: "natan-tasks",
    storageBucket: "natan-tasks.firebasestorage.app",
    messagingSenderId: "201676458373",
    appId: "1:201676458373:web:1bf76fdc27d14651b19cec",
    measurementId: "G-463031CGSR"
};
// ============================================================

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tasksRef = db.ref('tasks');

// State
let tasks = [];
let editingId = null;
let deleteId = null;
let currentFilter = 'all';
let currentSort = 'none';
const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
let loggedInUser = sessionStorage.getItem('loggedInUser') || null;

// DOM Elements
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const loginNameInput = document.getElementById('loginName');
const appContainer = document.getElementById('appContainer');
const loggedUserNameEl = document.getElementById('loggedUserName');
const taskForm = document.getElementById('taskForm');
const workerNameInput = document.getElementById('workerName');
const projectNumberInput = document.getElementById('projectNumber');
const workTypeInput = document.getElementById('workType');
const workDescriptionInput = document.getElementById('workDescription');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const priorityInput = document.getElementById('priority');
const statusInput = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const tasksBody = document.getElementById('tasksBody');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Maps
const workTypeLabels = { DT: 'DT', GEO: 'GEO' };

function getPriorityLabel(key) {
    const map = { critical: 'priority_critical', high: 'priority_high', medium: 'priority_medium', low: 'priority_low' };
    return T(map[key] || 'priority_medium');
}

function getStatusLabel(key) {
    const map = { working: 'status_working', waiting: 'status_waiting', completed: 'status_completed' };
    return T(map[key] || 'status_working');
}

// ===== FIREBASE REAL-TIME LISTENER =====
// This listens for ANY change in the database and auto-updates the UI

function startFirebaseListener() {
    tasksRef.on('value', (snapshot) => {
        const data = snapshot.val();
        tasks = [];
        if (data) {
            // Convert Firebase object { key: task } to array
            Object.keys(data).forEach(key => {
                const task = data[key];
                task.firebaseKey = key;
                if (!task.id) task.id = key;
                tasks.push(task);
            });
            // Sort newest first by default
            tasks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
        renderTasks();
        updateStats();
    });
}

// ===== FIREBASE CRUD =====

function saveTaskToFirebase(task) {
    if (task.firebaseKey) {
        // Update existing
        const key = task.firebaseKey;
        const taskData = { ...task };
        delete taskData.firebaseKey;
        return tasksRef.child(key).set(taskData);
    } else {
        // New task
        const taskData = { ...task };
        delete taskData.firebaseKey;
        return tasksRef.push(taskData);
    }
}

function deleteTaskFromFirebase(id) {
    const task = getTaskById(id);
    if (task && task.firebaseKey) {
        return tasksRef.child(task.firebaseKey).remove();
    }
}

function updateTaskInFirebase(id, updates) {
    const task = getTaskById(id);
    if (task && task.firebaseKey) {
        return tasksRef.child(task.firebaseKey).update(updates);
    }
}

// ===== LOGIN =====

document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    if (loggedInUser) {
        showApp();
    } else {
        loginOverlay.classList.remove('hidden');
        appContainer.style.display = 'none';
        loginNameInput.focus();
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = loginNameInput.value.trim();
    if (!name) return;
    loggedInUser = name;
    sessionStorage.setItem('loggedInUser', name);
    showApp();
});

function showApp() {
    loginOverlay.classList.add('hidden');
    appContainer.style.display = 'block';
    loggedUserNameEl.textContent = loggedInUser;
    setDefaultDate();
    startFirebaseListener();
    setupFilterButtons();
}

function logout() {
    sessionStorage.removeItem('loggedInUser');
    loggedInUser = null;
    loginOverlay.classList.remove('hidden');
    appContainer.style.display = 'none';
    loginNameInput.value = '';
    loginNameInput.focus();
}

// ===== UTILS =====

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
}

// ===== FORM =====

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const existingTask = editingId ? getTaskById(editingId) : null;
    const task = {
        id: editingId || generateId(),
        workerName: workerNameInput.value.trim(),
        projectNumber: projectNumberInput.value.trim(),
        workType: workTypeInput.value,
        workDescription: workDescriptionInput.value.trim(),
        priority: priorityInput.value,
        status: statusInput.value,
        startDate: startDateInput.value,
        endDate: endDateInput.value || null,
        createdAt: existingTask ? existingTask.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: loggedInUser
    };

    if (editingId && existingTask) {
        task.firebaseKey = existingTask.firebaseKey;
        saveTaskToFirebase(task);
        editingId = null;
        submitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg> <span data-i18n="btn_add">${T('btn_add')}</span>`;
        cancelEditBtn.style.display = 'none';
        showToast(T('toast_updated'), 'success');
    } else {
        saveTaskToFirebase(task);
        showToast(T('toast_added'), 'success');
    }

    taskForm.reset(); setDefaultDate(); statusInput.value = 'working';
});

// ===== EDIT =====

function editTask(id) {
    const task = getTaskById(id);
    if (!task) return;
    editingId = id;
    workerNameInput.value = task.workerName;
    projectNumberInput.value = task.projectNumber;
    workTypeInput.value = task.workType || 'DT';
    workDescriptionInput.value = task.workDescription;
    priorityInput.value = task.priority || 'medium';
    statusInput.value = task.status || 'working';
    startDateInput.value = task.startDate;
    endDateInput.value = task.endDate || '';
    submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
        </svg> <span data-i18n="btn_update">${T('btn_update')}</span>`;
    cancelEditBtn.style.display = 'inline-flex';
    taskForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    workerNameInput.focus();
}

function cancelEdit() {
    editingId = null; taskForm.reset(); setDefaultDate(); statusInput.value = 'working';
    submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg> <span data-i18n="btn_add">${T('btn_add')}</span>`;
    cancelEditBtn.style.display = 'none';
}

// ===== DELETE =====

function deleteTask(id) { deleteId = id; deleteModal.classList.add('visible'); }

confirmDeleteBtn.addEventListener('click', () => {
    if (deleteId) {
        deleteTaskFromFirebase(deleteId);
        closeDeleteModal();
        showToast(T('toast_deleted'), 'error');
    }
});

function closeDeleteModal() { deleteModal.classList.remove('visible'); deleteId = null; }
deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) closeDeleteModal(); });

// ===== STATUS CHANGE =====

function changeStatus(id, newStatus) {
    const task = getTaskById(id);
    if (!task) return;
    const updates = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: loggedInUser
    };
    if (newStatus === 'completed' && !task.endDate) {
        updates.endDate = new Date().toISOString().split('T')[0];
    }
    updateTaskInFirebase(id, updates);
    closeAllDropdowns();
    showToast(`${T('toast_status_changed')}${getStatusLabel(newStatus)}`, 'success');
}

function toggleStatusDropdown(id, event) {
    event.stopPropagation();
    const dd = document.getElementById(`dropdown-${id}`);
    const was = dd.classList.contains('visible');
    closeAllDropdowns();
    if (!was) dd.classList.add('visible');
}

function closeAllDropdowns() { document.querySelectorAll('.status-dropdown').forEach(d => d.classList.remove('visible')); }
document.addEventListener('click', () => { closeAllDropdowns(); });

// ===== RENDER =====

function renderTasks() {
    const filtered = getFilteredTasks();
    tasksBody.innerHTML = '';
    if (filtered.length === 0) {
        emptyState.classList.add('visible');
        document.querySelector('.table-wrapper').style.display = 'none';
        return;
    }
    emptyState.classList.remove('visible');
    document.querySelector('.table-wrapper').style.display = 'block';

    filtered.forEach((task, index) => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        const pClass = `priority-${task.priority || 'medium'}`;
        const pLabel = getPriorityLabel(task.priority);
        const sClass = `status-${task.status || 'working'}`;
        const sLabel = getStatusLabel(task.status);
        const wtClass = `worktype-${(task.workType || 'DT').toLowerCase()}`;
        const wtLabel = task.workType || 'DT';

        row.innerHTML = `
            <td class="row-number">${index + 1}</td>
            <td><strong>${escapeHtml(task.workerName)}</strong></td>
            <td>${escapeHtml(task.projectNumber)}</td>
            <td><span class="worktype-badge ${wtClass}">${wtLabel}</span></td>
            <td class="task-description" title="${escapeHtml(task.workDescription)}">${escapeHtml(task.workDescription)}</td>
            <td><span class="priority-badge ${pClass}">${pLabel}</span></td>
            <td>${formatDate(task.startDate)}</td>
            <td>${task.endDate ? formatDate(task.endDate) : '<span style="color:var(--gray-400)">—</span>'}</td>
            <td><span class="status-badge ${sClass}">${sLabel}</span></td>
            <td>
                <div class="updated-info">
                    <span class="updated-by">${task.updatedBy ? escapeHtml(task.updatedBy) : '—'}</span>
                    <span class="updated-date">${task.updatedAt ? formatDateTime(task.updatedAt) : ''}</span>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <div class="status-dropdown-wrapper">
                        <button class="action-btn status-change" onclick="toggleStatusDropdown('${task.id}',event)" title="${T('tip_status')}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </button>
                        <div class="status-dropdown" id="dropdown-${task.id}">
                            <button onclick="changeStatus('${task.id}','working')"><span class="dot blue"></span>${getStatusLabel('working')}</button>
                            <button onclick="changeStatus('${task.id}','waiting')"><span class="dot yellow"></span>${getStatusLabel('waiting')}</button>
                            <button onclick="changeStatus('${task.id}','completed')"><span class="dot green"></span>${getStatusLabel('completed')}</button>
                        </div>
                    </div>
                    <button class="action-btn edit" onclick="editTask('${task.id}')" title="${T('tip_edit')}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn delete" onclick="deleteTask('${task.id}')" title="${T('tip_delete')}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            </td>`;
        tasksBody.appendChild(row);
    });
}

// ===== FILTER & SEARCH =====

function getFilteredTasks() {
    let filtered = [...tasks];
    const term = searchInput.value.trim().toLowerCase();
    if (term) {
        filtered = filtered.filter(t =>
            t.workerName.toLowerCase().includes(term) ||
            t.projectNumber.toLowerCase().includes(term) ||
            t.workDescription.toLowerCase().includes(term) ||
            (t.workType || '').toLowerCase().includes(term)
        );
    }
    if (currentFilter === 'working') filtered = filtered.filter(t => t.status === 'working');
    else if (currentFilter === 'waiting') filtered = filtered.filter(t => t.status === 'waiting');
    else if (currentFilter === 'completed') filtered = filtered.filter(t => t.status === 'completed');

    if (currentSort === 'priority-desc') {
        filtered.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));
    } else if (currentSort === 'priority-asc') {
        filtered.sort((a, b) => (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2));
    }

    return filtered;
}

function setupFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
}

searchInput.addEventListener('input', () => { renderTasks(); });

// ===== SORT =====

function togglePrioritySort() {
    if (currentSort === 'none') currentSort = 'priority-desc';
    else if (currentSort === 'priority-desc') currentSort = 'priority-asc';
    else currentSort = 'none';
    updateSortIndicator();
    renderTasks();
}

function updateSortIndicator() {
    const th = document.getElementById('thPriority');
    if (!th) return;
    const arrow = th.querySelector('.sort-arrow');
    if (!arrow) return;
    arrow.classList.remove('sort-desc', 'sort-asc', 'sort-active');
    if (currentSort === 'priority-desc') {
        arrow.classList.add('sort-desc', 'sort-active');
    } else if (currentSort === 'priority-asc') {
        arrow.classList.add('sort-asc', 'sort-active');
    }
}

// ===== STATS =====

function updateStats() {
    animateNumber('totalTasks', tasks.length);
    animateNumber('workingTasks', tasks.filter(t => t.status === 'working').length);
    animateNumber('waitingTasks', tasks.filter(t => t.status === 'waiting').length);
    animateNumber('completedTasks', tasks.filter(t => t.status === 'completed').length);
}

function animateNumber(id, target) {
    const el = document.getElementById(id);
    const cur = parseInt(el.textContent) || 0;
    if (cur === target) return;
    const steps = 12; const inc = (target - cur) / steps; let step = 0;
    const timer = setInterval(() => {
        step++;
        if (step >= steps) { el.textContent = target; clearInterval(timer); }
        else el.textContent = Math.round(cur + inc * step);
    }, 25);
}

// ===== CSV EXPORT =====

function exportToCSV() {
    if (tasks.length === 0) { showToast(T('toast_export_empty'), 'error'); return; }
    const BOM = '\uFEFF';
    const headers = [T('th_num'), T('th_worker'), T('th_project'), T('th_worktype'), T('th_description'), T('th_priority'), T('th_start'), T('th_end'), T('th_status'), T('th_updated'), T('th_updated')];
    const rows = tasks.map((t, i) => [
        i + 1, t.workerName, t.projectNumber, t.workType || 'DT',
        t.workDescription.replace(/"/g, '""'),
        getPriorityLabel(t.priority),
        formatDate(t.startDate), t.endDate ? formatDate(t.endDate) : '—',
        getStatusLabel(t.status),
        t.updatedBy || '—', t.updatedAt ? formatDateTime(t.updatedAt) : '—'
    ]);
    let csv = BOM + headers.join(',') + '\n';
    rows.forEach(r => { csv += r.map(c => `"${c}"`).join(',') + '\n'; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `tasks_journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast(T('toast_export_ok'), 'success');
}

// ===== UTILS =====

function generateId() { return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); }
function getTaskById(id) { return tasks.find(t => t.id === id); }

function formatDate(s) {
    if (!s) return '';
    return new Date(s).toLocaleDateString('he-IL', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatDateTime(s) {
    if (!s) return '';
    const d = new Date(s);
    const ds = d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const ts = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    return `${ds} ${ts}`;
}

function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

// ===== TOAST =====

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.classList.add('visible'); });
    setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ===== KEYBOARD =====

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (deleteModal.classList.contains('visible')) closeDeleteModal();
        if (editingId) cancelEdit();
        closeAllDropdowns();
    }
});
