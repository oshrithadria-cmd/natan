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
const usersRef = db.ref('users');
const filesRef = db.ref('files');
const vacationsRef = db.ref('vacations');

// Default users (seeded on first load)
const DEFAULT_USERS = ['אשד', 'אושרית', 'נתנאל', 'אלון בנג\'י', 'סאמר'];
let allUsers = [];

// State
let tasks = [];
let editingId = null;
let deleteId = null;
let currentFilter = 'all';
let currentView = 'active'; // 'active' or 'archive'
let currentUserFilter = 'all';
let sortColumn = null;   // 'workerName', 'priority', 'startDate', etc.
let sortDirection = null; // 'asc' or 'desc'
const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
const statusOrder = { working: 0, waiting: 1, completed: 2 };
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
const workDescriptionInput = document.getElementById('workDescription');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const statusInput = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const tasksBody = document.getElementById('tasksBody');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Maps
function getStatusLabel(key) {
    const map = { working: 'status_working', waiting: 'status_waiting', completed: 'status_completed' };
    return T(map[key] || 'status_working');
}

// ===== FIREBASE REAL-TIME LISTENER =====
// This listens for ANY change in the database and auto-updates the UI

// Firebase converts arrays to objects with numeric keys - convert back
function firebaseToArray(obj) {
    if (Array.isArray(obj)) return obj;
    if (obj && typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length > 0 && keys.every(k => !isNaN(k))) {
            return keys.sort((a, b) => Number(a) - Number(b)).map(k => obj[k]);
        }
    }
    return [];
}

function startFirebaseListener() {
    tasksRef.on('value', (snapshot) => {
        const data = snapshot.val();
        tasks = [];
        if (data) {
            Object.keys(data).forEach(key => {
                const task = data[key];
                task.firebaseKey = key;
                if (!task.id) task.id = key;
                // Convert statusHistory from Firebase object to array
                if (task.statusHistory) {
                    task.statusHistory = firebaseToArray(task.statusHistory);
                }
                tasks.push(task);
            });
            // Sort by manual order first, then by creation date
            tasks.sort((a, b) => {
                const oA = typeof a.order === 'number' ? a.order : 999999;
                const oB = typeof b.order === 'number' ? b.order : 999999;
                if (oA !== oB) return oA - oB;
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });
        }
        renderTasks();
        updateStats();
        // Refresh summary if open
        const summarySection = document.getElementById('summarySection');
        if (summarySection && summarySection.style.display !== 'none') {
            renderSummary();
        }
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

// ===== USER MANAGEMENT =====

function startUsersListener() {
    usersRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            allUsers = Object.values(data).sort((a, b) => a.localeCompare(b, 'he'));
        } else {
            // Seed default users on first run
            allUsers = [...DEFAULT_USERS];
            seedDefaultUsers();
        }
        rebuildUserLists();
    }, (error) => {
        // Firebase error - fallback to defaults so login still works
        console.error('Users load error:', error);
        allUsers = [...DEFAULT_USERS];
        rebuildUserLists();
    });
}

function seedDefaultUsers() {
    const usersObj = {};
    DEFAULT_USERS.forEach((name, i) => usersObj['user_' + i] = name);
    usersRef.set(usersObj);
}

function addUserToFirebase(name) {
    const key = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    return usersRef.child(key).set(name);
}

function rebuildUserLists() {
    // 1) Login select
    const loginSelect = document.getElementById('loginName');
    const currentVal = loginSelect.value;
    // Keep the placeholder + "add new" option
    loginSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.setAttribute('data-i18n-opt', 'login_placeholder');
    placeholder.textContent = T('login_placeholder');
    loginSelect.appendChild(placeholder);

    allUsers.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        loginSelect.appendChild(opt);
    });

    // "Add new user" option
    const addOpt = document.createElement('option');
    addOpt.value = '__add_new__';
    addOpt.textContent = '➕ ' + T('login_add_new');
    loginSelect.appendChild(addOpt);

    // Restore selection if it existed
    if (currentVal && currentVal !== '__add_new__') loginSelect.value = currentVal;

    // 2) User filter buttons
    const container = document.getElementById('userFilterButtons');
    if (container) {
        // Keep "all" and "mine" buttons, remove the rest
        const existingBtns = container.querySelectorAll('.user-filter-btn:not([data-user="all"]):not([data-user="mine"])');
        existingBtns.forEach(b => b.remove());

        allUsers.forEach(name => {
            const btn = document.createElement('button');
            btn.className = 'user-filter-btn';
            btn.dataset.user = name;
            btn.textContent = name;
            if (currentUserFilter === name) btn.classList.add('active');
            container.appendChild(btn);
        });

        // Re-setup click handlers
        setupUserFilterButtons();
    }

    // 3) Summary worker select
    const summarySelect = document.getElementById('summaryWorkerSelect');
    if (summarySelect) {
        const summaryVal = summarySelect.value;
        summarySelect.innerHTML = '';
        const allOpt = document.createElement('option');
        allOpt.value = 'all';
        allOpt.setAttribute('data-i18n-opt', 'summary_all_workers');
        allOpt.textContent = T('summary_all_workers');
        summarySelect.appendChild(allOpt);

        allUsers.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            summarySelect.appendChild(opt);
        });

        if (summaryVal) summarySelect.value = summaryVal;
    }
}

// Handle login select change - show "add new" input
document.getElementById('loginName').addEventListener('change', function() {
    const addSection = document.getElementById('addNameSection');
    if (this.value === '__add_new__') {
        addSection.style.display = 'flex';
        document.getElementById('newUserName').focus();
    } else {
        addSection.style.display = 'none';
    }
});

function confirmAddNewUser() {
    const input = document.getElementById('newUserName');
    const name = input.value.trim();
    if (!name) {
        input.focus();
        return;
    }
    // Check if already exists
    if (allUsers.includes(name)) {
        document.getElementById('loginName').value = name;
        document.getElementById('addNameSection').style.display = 'none';
        input.value = '';
        return;
    }
    // Add to Firebase
    addUserToFirebase(name).then(() => {
        // The listener will rebuild the lists, then select the new name
        setTimeout(() => {
            document.getElementById('loginName').value = name;
            document.getElementById('addNameSection').style.display = 'none';
            input.value = '';
        }, 500);
    });
}

// ===== LOGIN =====

document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    startUsersListener();
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
    const selectVal = loginNameInput.value;
    if (!selectVal || selectVal === '__add_new__') return;
    const name = selectVal.trim();
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
    startTimeTrackingTimer();
    setupFilterButtons();
    setupUserFilterButtons();
    // Auto-select "My Tasks" on login
    currentUserFilter = 'mine';
    document.querySelectorAll('.user-filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.user === 'mine');
    });
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
    const nowISO = new Date().toISOString();
    const task = {
        id: editingId || generateId(),
        workerName: workerNameInput.value.trim(),
        projectNumber: projectNumberInput.value.trim(),
        workDescription: workDescriptionInput.value.trim(),
        status: statusInput.value,
        startDate: startDateInput.value,
        endDate: endDateInput.value || null,
        order: existingTask ? (existingTask.order ?? 999999) : 0,
        createdAt: existingTask ? existingTask.createdAt : nowISO,
        updatedAt: nowISO,
        updatedBy: loggedInUser,
        statusHistory: existingTask ? (Array.isArray(existingTask.statusHistory) ? [...existingTask.statusHistory] : firebaseToArray(existingTask.statusHistory)) : [{ status: statusInput.value, timestamp: nowISO }]
    };

    if (editingId && existingTask) {
        // If status changed during edit, add to history
        if (existingTask.status !== statusInput.value) {
            if (!task.statusHistory) task.statusHistory = [];
            task.statusHistory.push({ status: statusInput.value, timestamp: nowISO });
        }
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
    workDescriptionInput.value = task.workDescription;
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
    const nowISO = new Date().toISOString();
    const history = Array.isArray(task.statusHistory) ? [...task.statusHistory] : firebaseToArray(task.statusHistory);
    history.push({ status: newStatus, timestamp: nowISO });
    const updates = {
        status: newStatus,
        updatedAt: nowISO,
        updatedBy: loggedInUser,
        statusHistory: history
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

    // Build per-worker numbering
    const workerCounters = {};
    const workerNumbers = [];
    filtered.forEach(task => {
        const name = task.workerName || '?';
        workerCounters[name] = (workerCounters[name] || 0) + 1;
        workerNumbers.push(workerCounters[name]);
    });

    filtered.forEach((task, index) => {
        const row = document.createElement('tr');
        row.className = `fade-in row-status-${task.status || 'working'}`;
        row.dataset.taskId = task.id;
        row.draggable = true;
        const sClass = `status-${task.status || 'working'}`;
        const sLabel = getStatusLabel(task.status);
        const workerNum = `${escapeHtml(task.workerName)} ${workerNumbers[index]}`;
        const timeInfo = calcTaskSeconds(task);
        const workTimeHtml = formatTimeBadge(timeInfo.workSeconds, 'work', timeInfo.isWorking, task.id);

        row.innerHTML = `
            <td class="row-number drag-handle" title="${T('tip_drag')}">
                <span class="drag-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg></span>
                <span class="row-num-text">${workerNum}</span>
            </td>
            <td><strong>${escapeHtml(task.workerName)}</strong></td>
            <td>${escapeHtml(task.projectNumber)}</td>
            <td class="task-description" title="${escapeHtml(task.workDescription)}">${escapeHtml(task.workDescription)}</td>
            <td>${formatDate(task.startDate)}</td>
            <td>${task.endDate ? formatDate(task.endDate) : '<span style="color:var(--gray-400)">—</span>'}</td>
            <td><span class="status-badge ${sClass}">${sLabel}</span></td>
            <td>
                <div class="time-cell">
                    ${workTimeHtml}
                    <button class="time-edit-btn" onclick="openTimeEditModal('${task.id}')" title="${T('tip_edit_time')}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                </div>
            </td>
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

    // Setup drag & drop on rows
    setupDragAndDrop();
}

// ===== DRAG & DROP =====

let dragSrcRow = null;

function setupDragAndDrop() {
    const rows = tasksBody.querySelectorAll('tr');
    rows.forEach(row => {
        row.addEventListener('dragstart', handleDragStart);
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('dragenter', handleDragEnter);
        row.addEventListener('dragleave', handleDragLeave);
        row.addEventListener('drop', handleDrop);
        row.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    // If a column sort is active, reset it so manual drag order takes effect
    if (sortColumn) {
        sortColumn = null;
        sortDirection = null;
        updateAllSortIndicators();
    }
    dragSrcRow = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.taskId);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = getClosestRow(e.target);
    if (!target || target === dragSrcRow) return;

    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    target.classList.remove('drag-over-top', 'drag-over-bottom');
    if (e.clientY < midY) {
        target.classList.add('drag-over-top');
    } else {
        target.classList.add('drag-over-bottom');
    }
}

function handleDragEnter(e) {
    e.preventDefault();
}

function handleDragLeave(e) {
    const target = getClosestRow(e.target);
    if (target) target.classList.remove('drag-over-top', 'drag-over-bottom');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const target = getClosestRow(e.target);
    if (!target || target === dragSrcRow) return;

    const srcId = e.dataTransfer.getData('text/plain');
    const destId = target.dataset.taskId;

    // determine if dropping above or below
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const dropAbove = e.clientY < midY;

    target.classList.remove('drag-over-top', 'drag-over-bottom');

    // Reorder using the currently filtered list
    const filtered = getFilteredTasks();
    const srcIdx = filtered.findIndex(t => t.id === srcId);
    let destIdx = filtered.findIndex(t => t.id === destId);

    if (srcIdx === -1 || destIdx === -1 || srcIdx === destIdx) return;

    // Remove src from array, then insert at new position
    const movedTask = filtered.splice(srcIdx, 1)[0];
    // Recalculate destIdx after splice
    destIdx = filtered.findIndex(t => t.id === destId);
    if (destIdx === -1) destIdx = filtered.length;
    if (!dropAbove) destIdx += 1;
    if (destIdx > filtered.length) destIdx = filtered.length;
    filtered.splice(destIdx, 0, movedTask);

    // Update order on all filtered tasks and save to Firebase
    const updates = {};
    filtered.forEach((task, i) => {
        task.order = i;
        if (task.firebaseKey) {
            updates[task.firebaseKey + '/order'] = i;
        }
    });
    // Also update in main tasks array
    filtered.forEach(ft => {
        const mainTask = tasks.find(t => t.id === ft.id);
        if (mainTask) mainTask.order = ft.order;
    });
    // Batch update Firebase
    tasksRef.update(updates);
}

function handleDragEnd() {
    this.classList.remove('dragging');
    tasksBody.querySelectorAll('tr').forEach(r => {
        r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
}

function getClosestRow(el) {
    while (el && el.tagName !== 'TR') el = el.parentElement;
    return el;
}

// ===== FILTER & SEARCH =====

function getFilteredTasks() {
    let filtered = [...tasks];

    // View filter: active vs archive
    if (currentView === 'active') {
        filtered = filtered.filter(t => t.status !== 'completed');
    } else if (currentView === 'archive') {
        filtered = filtered.filter(t => t.status === 'completed');
    }

    const term = searchInput.value.trim().toLowerCase();
    if (term) {
        filtered = filtered.filter(t =>
            t.workerName.toLowerCase().includes(term) ||
            t.projectNumber.toLowerCase().includes(term) ||
            t.workDescription.toLowerCase().includes(term)
        );
    }
    if (currentFilter === 'working') filtered = filtered.filter(t => t.status === 'working');
    else if (currentFilter === 'waiting') filtered = filtered.filter(t => t.status === 'waiting');
    else if (currentFilter === 'completed') filtered = filtered.filter(t => t.status === 'completed');

    // User filter
    if (currentUserFilter === 'mine') {
        filtered = filtered.filter(t => t.workerName === loggedInUser);
    } else if (currentUserFilter !== 'all') {
        filtered = filtered.filter(t => t.workerName === currentUserFilter);
    }

    // Sort
    if (sortColumn && sortDirection) {
        filtered.sort((a, b) => {
            let valA, valB;
            if (sortColumn === 'priority') {
                valA = priorityOrder[a.priority] ?? 2;
                valB = priorityOrder[b.priority] ?? 2;
            } else if (sortColumn === 'status') {
                valA = statusOrder[a.status] ?? 1;
                valB = statusOrder[b.status] ?? 1;
            } else if (sortColumn === 'startDate' || sortColumn === 'endDate' || sortColumn === 'updatedAt') {
                valA = a[sortColumn] ? new Date(a[sortColumn]).getTime() : 0;
                valB = b[sortColumn] ? new Date(b[sortColumn]).getTime() : 0;
            } else {
                valA = (a[sortColumn] || '').toString().toLowerCase();
                valB = (b[sortColumn] || '').toString().toLowerCase();
            }
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
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

function setupUserFilterButtons() {
    document.querySelectorAll('.user-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.user-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentUserFilter = btn.dataset.user;
            renderTasks();
        });
    });
}

// ===== VIEW SWITCH (Active / Archive) =====

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.view === view);
    });
    // Update filter buttons visibility
    const filterBtns = document.querySelector('.filter-buttons');
    if (view === 'archive') {
        filterBtns.style.display = 'none';
    } else {
        filterBtns.style.display = '';
        // Reset to "all" filter
        currentFilter = 'all';
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
    }
    renderTasks();
}

function updateArchiveCount() {
    const count = tasks.filter(t => t.status === 'completed').length;
    const el = document.getElementById('archiveCount');
    if (el) el.textContent = count;
}

// ===== SORT =====

function toggleSort(column) {
    if (sortColumn === column) {
        if (sortDirection === 'desc') sortDirection = 'asc';
        else if (sortDirection === 'asc') { sortColumn = null; sortDirection = null; }
    } else {
        sortColumn = column;
        sortDirection = 'desc';
    }
    updateAllSortIndicators();
    renderTasks();
}

function updateAllSortIndicators() {
    document.querySelectorAll('.sortable-th').forEach(th => {
        const arrow = th.querySelector('.sort-arrow');
        if (!arrow) return;
        const col = th.dataset.sort;
        arrow.classList.remove('sort-desc', 'sort-asc', 'sort-active');
        if (col === sortColumn && sortDirection) {
            arrow.classList.add('sort-active');
            arrow.classList.add(sortDirection === 'desc' ? 'sort-desc' : 'sort-asc');
        }
    });
}

// ===== STATS =====

function updateStats() {
    animateNumber('totalTasks', tasks.filter(t => t.status !== 'completed').length);
    animateNumber('workingTasks', tasks.filter(t => t.status === 'working').length);
    animateNumber('waitingTasks', tasks.filter(t => t.status === 'waiting').length);
    animateNumber('completedTasks', tasks.filter(t => t.status === 'completed').length);
    updateArchiveCount();
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
    const headers = [T('th_num'), T('th_worker'), T('th_project'), T('th_description'), T('th_start'), T('th_end'), T('th_status'), T('th_work_time'), T('th_updated'), T('th_updated')];
    const exportCounters = {};
    const rows = tasks.map((t, i) => {
        exportCounters[t.workerName] = (exportCounters[t.workerName] || 0) + 1;
        const timeInfo = calcTaskSeconds(t);
        return [
        `${t.workerName} ${exportCounters[t.workerName]}`, t.workerName, t.projectNumber,
        t.workDescription.replace(/"/g, '""'),
        formatDate(t.startDate), t.endDate ? formatDate(t.endDate) : '—',
        getStatusLabel(t.status),
        formatDuration(Math.round(timeInfo.workSeconds / 60)),
        t.updatedBy || '—', t.updatedAt ? formatDateTime(t.updatedAt) : '—'
    ];
    });
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
        const timeModal = document.getElementById('timeEditModal');
        if (timeModal && timeModal.classList.contains('visible')) closeTimeEditModal();
        if (editingId) cancelEdit();
        closeAllDropdowns();
    }
});

// ===== PROJECT TIME TRACKING =====

// Format minutes into readable full string (e.g., "2 ימים 5 שעות 30 דקות")
function formatDuration(totalMinutes) {
    if (totalMinutes <= 0) return '—';
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const mins = totalMinutes % 60;
    let parts = [];
    if (days > 0) parts.push(days + ' ' + T('time_days_full'));
    if (hours > 0) parts.push(hours + ' ' + T('time_hours_full'));
    if (mins > 0 || parts.length === 0) parts.push(mins + ' ' + T('time_minutes_full'));
    return parts.join(' ');
}

// Format seconds into live clock string HH:MM:SS
function formatLiveClock(totalSeconds) {
    if (totalSeconds <= 0) return '00:00:00';
    const days = Math.floor(totalSeconds / 86400);
    const hrs = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    const pad = n => String(n).padStart(2, '0');
    if (days > 0) {
        return `${days}${T('time_days_short')}${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

// Calculate total seconds (more precise for live display)
function calcTaskSeconds(task) {
    const raw = task.statusHistory;
    const history = Array.isArray(raw) ? raw : firebaseToArray(raw);
    let workSeconds = 0;
    let waitSeconds = 0;

    if (!history || history.length === 0) {
        return { workSeconds: 0, waitSeconds: 0, isWorking: false, isWaiting: false };
    }

    const now = new Date();
    let isWorking = false;
    let isWaiting = false;

    for (let i = 0; i < history.length; i++) {
        const entry = history[i];
        const entryTime = new Date(entry.timestamp);
        let endTime;
        if (i < history.length - 1) {
            endTime = new Date(history[i + 1].timestamp);
        } else {
            if (entry.status === 'completed') {
                continue;
            }
            endTime = now;
            if (entry.status === 'working') isWorking = true;
            if (entry.status === 'waiting') isWaiting = true;
        }
        const diffSec = (endTime - entryTime) / 1000;

        if (entry.status === 'working') {
            workSeconds += diffSec;
        } else if (entry.status === 'waiting') {
            waitSeconds += diffSec;
        }
    }

    // Apply manual time adjustment (in seconds, can be positive or negative)
    const manualAdj = typeof task.manualTimeSeconds === 'number' ? task.manualTimeSeconds : 0;

    return {
        workSeconds: Math.max(0, Math.round(workSeconds) + manualAdj),
        waitSeconds: Math.max(0, Math.round(waitSeconds)),
        isWorking,
        isWaiting
    };
}

// Format time badge HTML
function formatTimeBadge(seconds, type, isLive, taskId) {
    const minutes = Math.round(seconds / 60);
    if (seconds <= 0 && !isLive) {
        return `<span class="time-badge time-badge-done" data-time-type="${type}" data-time-task="${taskId || ''}">—</span>`;
    }
    const liveClass = isLive ? ' time-live' : '';
    const typeClass = type === 'work' ? 'time-badge-work' : 'time-badge-wait';
    const displayText = isLive ? formatLiveClock(seconds) : formatDuration(minutes);
    return `<span class="time-badge ${typeClass}${liveClass}" data-time-type="${type}" data-time-task="${taskId || ''}">${displayText}</span>`;
}

// Refresh live timers every second (only updates badge text, not full re-render)
let timeTrackingInterval = null;
function startTimeTrackingTimer() {
    if (timeTrackingInterval) clearInterval(timeTrackingInterval);
    timeTrackingInterval = setInterval(() => {
        if (!loggedInUser) return;
        updateLiveTimers();
    }, 1000);
}

function updateLiveTimers() {
    const liveBadges = document.querySelectorAll('.time-badge.time-live');
    if (liveBadges.length === 0) return;

    liveBadges.forEach(badge => {
        const taskId = badge.dataset.timeTask;
        const type = badge.dataset.timeType;
        if (!taskId) return;
        const task = getTaskById(taskId);
        if (!task) return;
        const timeInfo = calcTaskSeconds(task);
        const seconds = type === 'work' ? timeInfo.workSeconds : timeInfo.waitSeconds;
        badge.textContent = formatLiveClock(seconds);
    });
}

// ===== SUMMARY DASHBOARD =====

function toggleSummary() {
    const section = document.getElementById('summarySection');
    if (section.style.display === 'none') {
        section.style.display = 'block';
        renderSummary();
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        section.style.display = 'none';
    }
}

// Calculate working seconds for a task within a given time range
function calcWorkSecondsInRange(task, rangeStart, rangeEnd) {
    const raw = task.statusHistory;
    const history = Array.isArray(raw) ? raw : firebaseToArray(raw);
    let workSeconds = 0;

    if (!history || history.length === 0) return 0;

    const now = new Date();
    for (let i = 0; i < history.length; i++) {
        const entry = history[i];
        if (entry.status !== 'working') continue;

        const entryTime = new Date(entry.timestamp);
        let endTime;
        if (i < history.length - 1) {
            endTime = new Date(history[i + 1].timestamp);
        } else {
            if (entry.status === 'completed') continue;
            endTime = now;
        }

        // Clamp to range
        const clampedStart = entryTime < rangeStart ? rangeStart : entryTime;
        const clampedEnd = endTime > rangeEnd ? rangeEnd : endTime;
        if (clampedStart < clampedEnd) {
            workSeconds += (clampedEnd - clampedStart) / 1000;
        }
    }
    return Math.max(0, Math.round(workSeconds));
}

function renderSummary() {
    const workerSelect = document.getElementById('summaryWorkerSelect');
    const selectedWorker = workerSelect.value;

    // Filter tasks by selected worker
    let relevantTasks = tasks;
    if (selectedWorker !== 'all') {
        relevantTasks = tasks.filter(t => t.workerName === selectedWorker);
    }

    const now = new Date();

    // Day range: start of today
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = now;

    // Week range: start of this week (Sunday)
    const dayOfWeek = now.getDay(); // 0=Sunday
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    const weekEnd = now;

    // Month range: start of this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = now;

    // Total range: all time
    const allStart = new Date(2000, 0, 1);
    const allEnd = now;

    let dayTotal = 0, weekTotal = 0, monthTotal = 0, grandTotal = 0;

    // Per-project breakdown: { workerName -> { projectNumber -> seconds } }
    const perWorkerProject = {};

    relevantTasks.forEach(task => {
        const ds = calcWorkSecondsInRange(task, dayStart, dayEnd);
        const ws = calcWorkSecondsInRange(task, weekStart, weekEnd);
        const ms = calcWorkSecondsInRange(task, monthStart, monthEnd);
        const ts = calcTaskSeconds(task).workSeconds;

        dayTotal += ds;
        weekTotal += ws;
        monthTotal += ms;
        grandTotal += ts;

        // Per project
        const worker = task.workerName || '?';
        const project = task.projectNumber || '?';
        if (!perWorkerProject[worker]) perWorkerProject[worker] = {};
        if (!perWorkerProject[worker][project]) perWorkerProject[worker][project] = 0;
        perWorkerProject[worker][project] += ts;
    });

    // Update period cards
    document.getElementById('summaryDay').textContent = formatDuration(Math.round(dayTotal / 60));
    document.getElementById('summaryWeek').textContent = formatDuration(Math.round(weekTotal / 60));
    document.getElementById('summaryMonth').textContent = formatDuration(Math.round(monthTotal / 60));
    document.getElementById('summaryTotal').textContent = formatDuration(Math.round(grandTotal / 60));

    // Render per-project table
    const tbody = document.getElementById('summaryProjectsBody');
    tbody.innerHTML = '';

    const rows = [];
    Object.keys(perWorkerProject).sort().forEach(worker => {
        const projects = perWorkerProject[worker];
        Object.keys(projects).sort().forEach(project => {
            const secs = projects[project];
            if (secs > 0) {
                rows.push({ worker, project, seconds: secs });
            }
        });
    });

    if (rows.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="3" style="text-align:center;color:var(--gray-400);padding:20px;">${T('summary_no_data')}</td>`;
        tbody.appendChild(tr);
        return;
    }

    rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHtml(r.worker)}</strong></td>
            <td>${escapeHtml(r.project)}</td>
            <td>${formatDuration(Math.round(r.seconds / 60))}</td>`;
        tbody.appendChild(tr);
    });
}

// ===== EXPORT SUMMARY TO CSV =====

function exportSummaryToCSV() {
    const workerSelect = document.getElementById('summaryWorkerSelect');
    const selectedWorker = workerSelect.value;

    let relevantTasks = tasks;
    if (selectedWorker !== 'all') {
        relevantTasks = tasks.filter(t => t.workerName === selectedWorker);
    }

    if (relevantTasks.length === 0) {
        showToast(T('toast_export_empty'), 'error');
        return;
    }

    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build per-worker per-project data with period breakdowns
    const data = {};
    relevantTasks.forEach(task => {
        const worker = task.workerName || '?';
        const project = task.projectNumber || '?';
        const key = `${worker}|||${project}`;
        if (!data[key]) {
            data[key] = { worker, project, day: 0, week: 0, month: 0, total: 0 };
        }
        data[key].day += calcWorkSecondsInRange(task, dayStart, now);
        data[key].week += calcWorkSecondsInRange(task, weekStart, now);
        data[key].month += calcWorkSecondsInRange(task, monthStart, now);
        data[key].total += calcTaskSeconds(task).workSeconds;
    });

    const BOM = '\uFEFF';
    const headers = [
        T('summary_worker'),
        T('summary_project'),
        T('summary_day'),
        T('summary_week'),
        T('summary_month'),
        T('summary_total')
    ];

    let csv = BOM + headers.map(h => `"${h}"`).join(',') + '\n';

    // Data rows
    const workerTotals = {};
    Object.values(data).sort((a, b) => a.worker.localeCompare(b.worker) || a.project.localeCompare(b.project)).forEach(r => {
        csv += [
            `"${r.worker}"`,
            `"${r.project}"`,
            `"${formatDuration(Math.round(r.day / 60))}"`,
            `"${formatDuration(Math.round(r.week / 60))}"`,
            `"${formatDuration(Math.round(r.month / 60))}"`,
            `"${formatDuration(Math.round(r.total / 60))}"`
        ].join(',') + '\n';

        // Accumulate worker totals
        if (!workerTotals[r.worker]) {
            workerTotals[r.worker] = { day: 0, week: 0, month: 0, total: 0 };
        }
        workerTotals[r.worker].day += r.day;
        workerTotals[r.worker].week += r.week;
        workerTotals[r.worker].month += r.month;
        workerTotals[r.worker].total += r.total;
    });

    // Add empty row separator
    csv += '\n';

    // Add worker totals section
    csv += [
        `"${T('summary_worker')}"`,
        `"${T('summary_total')}"`,
        `"${T('summary_day')}"`,
        `"${T('summary_week')}"`,
        `"${T('summary_month')}"`,
        `"${T('summary_total')}"`
    ].join(',') + '\n';

    Object.keys(workerTotals).sort().forEach(worker => {
        const wt = workerTotals[worker];
        csv += [
            `"${worker}"`,
            `""`,
            `"${formatDuration(Math.round(wt.day / 60))}"`,
            `"${formatDuration(Math.round(wt.week / 60))}"`,
            `"${formatDuration(Math.round(wt.month / 60))}"`,
            `"${formatDuration(Math.round(wt.total / 60))}"`
        ].join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const dateStr = now.toISOString().split('T')[0];
    const workerLabel = selectedWorker === 'all' ? 'all' : selectedWorker;
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `hours_summary_${workerLabel}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(T('toast_export_ok'), 'success');
}

// ===== MANUAL TIME EDIT =====

let timeEditTaskId = null;

function openTimeEditModal(taskId) {
    const task = getTaskById(taskId);
    if (!task) return;
    timeEditTaskId = taskId;

    const timeInfo = calcTaskSeconds(task);
    const totalMin = Math.round(timeInfo.workSeconds / 60);
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;

    document.getElementById('timeEditCurrent').textContent =
        `${T('time_edit_current')}: ${formatDuration(totalMin)}`;
    document.getElementById('timeEditHours').value = hours;
    document.getElementById('timeEditMinutes').value = mins;
    document.getElementById('timeEditModal').classList.add('visible');
}

function closeTimeEditModal() {
    document.getElementById('timeEditModal').classList.remove('visible');
    timeEditTaskId = null;
}

document.getElementById('timeEditModal').addEventListener('click', (e) => {
    if (e.target.id === 'timeEditModal') closeTimeEditModal();
});

document.getElementById('confirmTimeEdit').addEventListener('click', () => {
    if (!timeEditTaskId) return;
    const task = getTaskById(timeEditTaskId);
    if (!task) return;

    const newHours = parseInt(document.getElementById('timeEditHours').value) || 0;
    const newMinutes = parseInt(document.getElementById('timeEditMinutes').value) || 0;
    const newTotalSeconds = (newHours * 3600) + (newMinutes * 60);

    // Calculate the automatic work seconds (without manual adjustment)
    const raw = task.statusHistory;
    const history = Array.isArray(raw) ? raw : firebaseToArray(raw);
    let autoWorkSeconds = 0;
    const now = new Date();
    if (history && history.length > 0) {
        for (let i = 0; i < history.length; i++) {
            const entry = history[i];
            const entryTime = new Date(entry.timestamp);
            let endTime;
            if (i < history.length - 1) {
                endTime = new Date(history[i + 1].timestamp);
            } else {
                if (entry.status === 'completed') continue;
                endTime = now;
            }
            if (entry.status === 'working') {
                autoWorkSeconds += (endTime - entryTime) / 1000;
            }
        }
    }
    autoWorkSeconds = Math.max(0, Math.round(autoWorkSeconds));

    const manualTimeSeconds = newTotalSeconds - autoWorkSeconds;

    updateTaskInFirebase(timeEditTaskId, {
        manualTimeSeconds: manualTimeSeconds,
        updatedAt: new Date().toISOString(),
        updatedBy: loggedInUser
    });

    closeTimeEditModal();
    showToast(T('toast_time_updated'), 'success');
});

// ===== FILES / DOCUMENTS SECTION =====

const FILES_ADMINS = ['נתנאל', 'אושרית'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function isFilesAdmin() {
    return FILES_ADMINS.includes(loggedInUser);
}

function toggleFilesSection() {
    const section = document.getElementById('filesSection');
    if (section.style.display === 'none') {
        section.style.display = 'block';
        // Show upload area only for admins
        document.getElementById('filesUploadArea').style.display = isFilesAdmin() ? 'block' : 'none';
        startFilesListener();
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        section.style.display = 'none';
    }
}

let filesListenerStarted = false;

function startFilesListener() {
    if (filesListenerStarted) return;
    filesListenerStarted = true;
    filesRef.orderByChild('uploadedAt').on('value', (snapshot) => {
        const data = snapshot.val();
        renderFiles(data);
    });
}

function handleFileUpload(input) {
    if (!isFilesAdmin()) {
        showToast(T('files_no_permission'), 'error');
        return;
    }
    const file = input.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
        showToast(T('files_too_large'), 'error');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64 = e.target.result;
        const fileData = {
            name: file.name,
            size: file.size,
            type: file.type,
            data: base64,
            uploadedBy: loggedInUser,
            uploadedAt: new Date().toISOString()
        };
        filesRef.push(fileData).then(() => {
            showToast(T('files_uploaded'), 'success');
            input.value = '';
        }).catch(() => {
            showToast(T('files_upload_error'), 'error');
            input.value = '';
        });
    };
    reader.readAsDataURL(file);
}

function renderFiles(data) {
    const list = document.getElementById('filesList');
    const empty = document.getElementById('filesEmpty');

    if (!data) {
        list.innerHTML = '';
        list.appendChild(empty);
        empty.style.display = 'flex';
        return;
    }

    const files = [];
    Object.keys(data).forEach(key => {
        files.push({ ...data[key], firebaseKey: key });
    });
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    if (files.length === 0) {
        list.innerHTML = '';
        list.appendChild(empty);
        empty.style.display = 'flex';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = '';

    files.forEach(file => {
        const card = document.createElement('div');
        card.className = 'file-card';

        const icon = getFileIcon(file.name);
        const sizeStr = formatFileSize(file.size);
        const dateStr = formatDateTime(file.uploadedAt);
        const deleteBtn = isFilesAdmin()
            ? `<button class="file-delete-btn" onclick="deleteFile('${file.firebaseKey}')" title="${T('tip_delete')}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
               </button>`
            : '';

        card.innerHTML = `
            <div class="file-icon">${icon}</div>
            <div class="file-info">
                <span class="file-name">${escapeHtml(file.name)}</span>
                <span class="file-meta">${sizeStr} · ${escapeHtml(file.uploadedBy)} · ${dateStr}</span>
            </div>
            <div class="file-actions">
                <button class="file-download-btn" onclick="downloadFile('${file.firebaseKey}')" title="${T('files_download')}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>${T('files_download')}</span>
                </button>
                ${deleteBtn}
            </div>`;
        list.appendChild(card);
    });
}

function downloadFile(key) {
    filesRef.child(key).once('value', (snapshot) => {
        const file = snapshot.val();
        if (!file || !file.data) return;
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

function deleteFile(key) {
    if (!isFilesAdmin()) return;
    if (confirm(T('files_confirm_delete'))) {
        filesRef.child(key).remove();
        showToast(T('files_deleted'), 'success');
    }
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><text x="7" y="19" font-size="6" fill="#EF4444" stroke="none" font-weight="bold">PDF</text></svg>';
    if (['doc', 'docx'].includes(ext)) return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><rect x="8" y="13" width="8" height="6" rx="1"/></svg>';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
    return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ===== VACATION CALENDAR =====

let calYear, calMonth; // current displayed month
let calVacations = {}; // { "2026-02-07": { "נתנאל": { type: "vacation", note: "..." }, ... } }
let calListenerStarted = false;

const CAL_TYPES = ['vacation', 'sick', 'other'];
const CAL_TYPE_LABELS = {
    vacation: 'cal_vacation',
    sick: 'cal_sick',
    other: 'cal_other'
};

function toggleCalendarSection() {
    const section = document.getElementById('calendarSection');
    if (section.style.display === 'none') {
        section.style.display = 'block';
        const now = new Date();
        calYear = now.getFullYear();
        calMonth = now.getMonth();
        startCalendarListener();
        renderCalendar();
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        section.style.display = 'none';
    }
}

function startCalendarListener() {
    if (calListenerStarted) return;
    calListenerStarted = true;
    vacationsRef.on('value', (snapshot) => {
        calVacations = snapshot.val() || {};
        renderCalendar();
    });
}

function calPrevMonth() {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
}

function calNextMonth() {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
}

function calGoToday() {
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    renderCalendar();
}

function getHebrewMonthName(month, year) {
    return new Date(year, month).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
}

function renderCalendar() {
    const label = document.getElementById('calMonthLabel');
    label.textContent = getHebrewMonthName(calMonth, calYear);

    const grid = document.getElementById('calGrid');
    grid.innerHTML = '';

    // Day headers (Sun-Sat)
    const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
    dayNames.forEach(d => {
        const header = document.createElement('div');
        header.className = 'cal-day-header';
        header.textContent = d;
        grid.appendChild(header);
    });

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-day cal-day-empty';
        grid.appendChild(empty);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        if (dateStr === todayStr) cell.classList.add('cal-day-today');

        const dayNum = document.createElement('span');
        dayNum.className = 'cal-day-num';
        dayNum.textContent = day;
        cell.appendChild(dayNum);

        // Show vacations for this date
        const dateData = calVacations[dateStr];
        if (dateData) {
            const entries = document.createElement('div');
            entries.className = 'cal-entries';
            Object.keys(dateData).forEach(user => {
                const entry = dateData[user];
                const tag = document.createElement('div');
                tag.className = `cal-entry cal-entry-${entry.type || 'vacation'}`;
                tag.textContent = user + (entry.note ? ': ' + entry.note : '');
                tag.title = `${user} - ${T(CAL_TYPE_LABELS[entry.type] || 'cal_vacation')}${entry.note ? ' - ' + entry.note : ''}`;
                entries.appendChild(tag);
            });
            cell.appendChild(entries);
        }

        cell.addEventListener('click', () => openCalDayModal(dateStr, day));
        grid.appendChild(cell);
    }
}

// Modal for adding/removing vacation
function openCalDayModal(dateStr, day) {
    const dateData = calVacations[dateStr] || {};
    const myEntry = dateData[loggedInUser];

    // Build a simple modal
    const existing = document.getElementById('calDayModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay visible';
    overlay.id = 'calDayModal';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    const displayDate = new Date(dateStr).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const otherEntries = Object.keys(dateData)
        .filter(u => u !== loggedInUser)
        .map(u => {
            const e = dateData[u];
            return `<div class="cal-modal-entry cal-entry-${e.type || 'vacation'}"><strong>${escapeHtml(u)}</strong> - ${T(CAL_TYPE_LABELS[e.type] || 'cal_vacation')}${e.note ? ': ' + escapeHtml(e.note) : ''}</div>`;
        }).join('');

    overlay.innerHTML = `
        <div class="modal cal-modal">
            <div class="modal-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h3>${displayDate}</h3>
            ${otherEntries ? '<div class="cal-modal-others">' + otherEntries + '</div>' : ''}
            <div class="cal-modal-form">
                <label>${T('cal_type')}:</label>
                <div class="cal-type-buttons">
                    <button class="cal-type-btn cal-type-vacation ${myEntry && myEntry.type === 'vacation' ? 'active' : ''}" data-type="vacation">${T('cal_vacation')}</button>
                    <button class="cal-type-btn cal-type-sick ${myEntry && myEntry.type === 'sick' ? 'active' : ''}" data-type="sick">${T('cal_sick')}</button>
                    <button class="cal-type-btn cal-type-other ${myEntry && myEntry.type === 'other' ? 'active' : ''}" data-type="other">${T('cal_other')}</button>
                </div>
                <div class="cal-date-range">
                    <div class="cal-date-field">
                        <label>${T('cal_from')}:</label>
                        <input type="date" id="calDateFrom" value="${dateStr}">
                    </div>
                    <div class="cal-date-field">
                        <label>${T('cal_to')}:</label>
                        <input type="date" id="calDateTo" value="${dateStr}">
                    </div>
                </div>
                <input type="text" id="calNoteInput" placeholder="${T('cal_note_ph')}" value="${myEntry ? escapeHtml(myEntry.note || '') : ''}" maxlength="50">
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" id="calSaveBtn">${T('cal_save')}</button>
                ${myEntry ? `<button class="btn btn-danger" id="calRemoveBtn">${T('cal_remove')}</button>` : ''}
                <button class="btn btn-secondary" onclick="document.getElementById('calDayModal').remove()">${T('btn_cancel')}</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    // Type button selection
    let selectedType = myEntry ? myEntry.type : 'vacation';
    overlay.querySelectorAll('.cal-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            overlay.querySelectorAll('.cal-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedType = btn.dataset.type;
        });
    });
    if (!myEntry) {
        overlay.querySelector('.cal-type-vacation').classList.add('active');
    }

    // Save - supports date range
    document.getElementById('calSaveBtn').addEventListener('click', () => {
        const note = document.getElementById('calNoteInput').value.trim();
        const fromStr = document.getElementById('calDateFrom').value;
        const toStr = document.getElementById('calDateTo').value;

        if (!fromStr) return;
        const fromDate = new Date(fromStr);
        const toDate = toStr ? new Date(toStr) : fromDate;

        if (toDate < fromDate) {
            showToast(T('cal_date_error'), 'error');
            return;
        }

        const updates = {};
        const current = new Date(fromDate);
        let dayCount = 0;
        while (current <= toDate) {
            const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
            updates[key + '/' + loggedInUser] = {
                type: selectedType,
                note: note,
                updatedAt: new Date().toISOString()
            };
            current.setDate(current.getDate() + 1);
            dayCount++;
            if (dayCount > 60) break; // safety limit
        }
        vacationsRef.update(updates);
        overlay.remove();
        showToast(T('cal_saved') + (dayCount > 1 ? ` (${dayCount} ${T('cal_days')})` : ''), 'success');
    });

    // Remove - removes range too
    const removeBtn = document.getElementById('calRemoveBtn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            const fromStr = document.getElementById('calDateFrom').value;
            const toStr = document.getElementById('calDateTo').value;
            const fromDate = new Date(fromStr);
            const toDate = toStr ? new Date(toStr) : fromDate;
            const updates = {};
            const current = new Date(fromDate);
            let dayCount = 0;
            while (current <= toDate) {
                const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                updates[key + '/' + loggedInUser] = null;
                current.setDate(current.getDate() + 1);
                dayCount++;
                if (dayCount > 60) break;
            }
            vacationsRef.update(updates);
            overlay.remove();
            showToast(T('cal_removed'), 'success');
        });
    }
}
