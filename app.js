// --- 1. Variables Globales et Configuration ---

const STORAGE_KEYS = {
    TASKS: 'todoApp.tasks',
    ARCHIVE: 'todoApp.archive',
    STREAK: 'todoApp.currentStreak',
    MAX_STREAK: 'todoApp.maxStreak',
    TOTAL_POINTS: 'todoApp.totalPoints',
    STREAK_HISTORY: 'todoApp.streakHistory',
    POINTS_HISTORY: 'todoApp.pointsHistory',
    LAST_CHECK: 'todoApp.lastCheckDate',
    SETTINGS: 'todoApp.settings',
    SHOP_ITEMS: 'todoApp.shopItems',
    PROFILE: 'todoApp.profile'
};

const POINTS_CONFIG = { easy: 1, medium: 3, hard: 5, newStreakRecord: 10 };
const RESET_HOUR = 0; 

const USER_ID = "mock_user_123"; 

const BASE_PATH = `todo_tasks/${USER_ID}`; 
const TASKS_PATH = `${BASE_PATH}/tasks`; 
const STATS_PATH = `${BASE_PATH}/stats`; 
const ARCHIVE_PATH = `${BASE_PATH}/archive`; 

let tasks = [];
let archive = [];
let currentStreak = 0;
let maxStreak = 0;
let totalPoints = 0;
let streakHistory = [];
let pointsHistory = [];
let lastCheckDate = null;

let appSettings = {
    hapticsEnabled: true,
    socialShareEnabled: false, 
    notificationLeadTimeMinutes: 30 
};

let shopItems = [];
let profile = {
    icon: '👤', 
};

let currentSort = 'default'; 
let currentFilter = 'all'; 


// --- 2. Fonctions de Stockage (Local / Firebase) ---

/** Initialise la boutique avec les articles par défaut. */
function initializeShop() {
    const defaultItems = [
        { id: 1, name: "Icône 'Rocket'", cost: 100, type: 'icon', value: '🚀', owned: false, description: "Pour atteindre les sommets." },
        { id: 2, name: "Icône 'Star'", cost: 250, type: 'icon', value: '⭐', owned: false, description: "Brillez de mille feux." },
        { id: 3, name: "Icône 'Ninja'", cost: 500, type: 'icon', value: '🥷', owned: false, description: "Maître de la furtivité." },
        { id: 4, name: "Reset de Série", cost: 1000, type: 'utility', value: 'reset_streak', owned: false, description: "Réinitialise votre série sans pénalité." }
    ];
    shopItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_ITEMS) || JSON.stringify(defaultItems));
}

/** Charge toutes les données depuis localStorage ou Firebase. */
function loadData() {
    loadLocalData(); 
    initializeShop();
    
    if (appSettings.socialShareEnabled) {
        setupFirebaseListener();
    } else {
        loadTasksFromLocal();
    }
    loadSettingsUI(); 
}

/** Charge les données qui restent locales (Réglages, Profil, Boutique). */
function loadLocalData() {
    const loadedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
    appSettings = { 
        ...appSettings, 
        ...loadedSettings,
        notificationLeadTimeMinutes: loadedSettings.notificationLeadTimeMinutes || 30 
    };
    lastCheckDate = localStorage.getItem(STORAGE_KEYS.LAST_CHECK);
    
    const loadedProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || '{}');
    profile = { ...profile, ...loadedProfile };
}

/** Charge les tâches et stats depuis localStorage (mode local). */
function loadTasksFromLocal() {
    tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    archive = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARCHIVE) || '[]');
    currentStreak = parseInt(localStorage.getItem(STORAGE_KEYS.STREAK) || '0');
    maxStreak = parseInt(localStorage.getItem(STORAGE_KEYS.MAX_STREAK) || '0');
    totalPoints = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_POINTS) || '0');
    streakHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.STREAK_HISTORY) || '[]');
    pointsHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.POINTS_HISTORY) || '[]');
    updateUI();
}

/** Sauvegarde toutes les données localement. */
function saveLocalData() {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.ARCHIVE, JSON.stringify(archive));
    localStorage.setItem(STORAGE_KEYS.STREAK, currentStreak.toString());
    localStorage.setItem(STORAGE_KEYS.MAX_STREAK, maxStreak.toString());
    localStorage.setItem(STORAGE_KEYS.TOTAL_POINTS, totalPoints.toString());
    localStorage.setItem(STORAGE_KEYS.STREAK_HISTORY, JSON.stringify(streakHistory));
    localStorage.setItem(STORAGE_KEYS.POINTS_HISTORY, JSON.stringify(pointsHistory));
    localStorage.setItem(STORAGE_KEYS.LAST_CHECK, lastCheckDate);
    
    localStorage.setItem(STORAGE_KEYS.SHOP_ITEMS, JSON.stringify(shopItems));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

/** Initialise l'écouteur pour Firebase RTDB. */
function setupFirebaseListener() {
    if (!window.db) {
        console.error("Erreur: Firebase RTDB non initialisée.");
        return;
    }
    const userRef = window.ref(window.db, BASE_PATH);
    window.onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            tasks = data.tasks ? Object.keys(data.tasks).map(key => ({ ...data.tasks[key], id: key })) : [];
            currentStreak = data.stats ? data.stats.currentStreak || 0 : 0;
            maxStreak = data.stats ? data.stats.maxStreak || 0 : 0;
            totalPoints = data.stats ? data.stats.totalPoints || 0 : 0;
            archive = data.archive ? Object.values(data.archive) : [];
            streakHistory = data.streakHistory ? Object.values(data.streakHistory) : [];
            pointsHistory = data.pointsHistory ? Object.values(data.pointsHistory) : [];
        } else {
            syncLocalToFirebase();
        }
        updateUI(); 
    }, (error) => {
        console.error("Erreur de connexion Firebase :", error);
        appSettings.socialShareEnabled = false;
        loadTasksFromLocal();
        updateUI();
    });
}

/** Pousse l'ensemble des données locales vers Firebase. */
async function syncLocalToFirebase() {
    const userRef = window.ref(window.db, BASE_PATH);
    const tasksData = tasks.reduce((acc, task) => {
        acc[task.id] = { 
            text: task.text, completed: task.completed, difficulty: task.difficulty, 
            points: task.points, createdAt: task.createdAt, 
            isRecurring: task.isRecurring || false, 
            recurrenceType: task.recurrenceType || null, 
            recurrenceValue: task.recurrenceValue || 1,
            dueTime: task.dueTime || null
        };
        return acc;
    }, {});
    
    const dataToSync = {
        tasks: tasksData,
        stats: { currentStreak, maxStreak, totalPoints },
        archive: archive,
        streakHistory: streakHistory,
        pointsHistory: pointsHistory
    };

    try {
        await window.set(userRef, dataToSync);
    } catch (e) {
        console.error("Erreur de synchronisation :", e);
    }
}

/** Sauvegarde un état (stats ou historique) sur Firebase. */
async function saveFirebaseState(path, data) {
    if (!appSettings.socialShareEnabled) return;
    const fullPath = `${BASE_PATH}/${path}`; 
    const dataRef = window.ref(window.db, fullPath);
    try {
        await window.set(dataRef, data);
    } catch (e) {
        console.error(`Erreur d'écriture sur Firebase à ${fullPath}:`, e);
    }
}


// --- 3. Logique de l'Application (Tâches, Série, Points) ---

/** Calcule le niveau de l'utilisateur. */
function calculateLevel() {
    return Math.floor(Math.sqrt(totalPoints / 100));
}

/** Vérifie la récurrence et gère la réinitialisation quotidienne. */
function checkRecurrenceAndDailyReset() {
    const now = new Date();
    const todayStr = now.toLocaleDateString('fr-FR');
    const lastCheckTime = lastCheckDate ? new Date(lastCheckDate.split('/').reverse().join('-')) : null;

    const isNewDay = !lastCheckTime || (now.setHours(RESET_HOUR, 0, 0, 0) > lastCheckTime.setHours(RESET_HOUR, 0, 0, 0));
    
    if (isNewDay) {
        
        // --- 1. Vérification et mise à jour de la Série ---
        const allCompleted = tasks.every(task => task.completed || !task.isRecurring); 
        const tasksToCompleteCount = tasks.filter(task => !task.completed).length;

        if (tasks.filter(t => !t.completed).length > 0 && !allCompleted) {
            if (currentStreak > 0) {
                streakHistory.push({ date: lastCheckDate, streak: currentStreak });
                alert(`Dommage ! Votre série de ${currentStreak} jour(s) est brisée. ${tasksToCompleteCount} tâches non finies !`);
            }
            currentStreak = 0; 
        } else if (tasks.length > 0 && allCompleted) {
            currentStreak++;
        }

        // --- 2. Mise à jour du Record de Série (Max Streak) ---
        if (currentStreak > maxStreak) {
            maxStreak = currentStreak; 
            totalPoints += POINTS_CONFIG.newStreakRecord;
            pointsHistory.push({ 
                date: todayStr, 
                points: POINTS_CONFIG.newStreakRecord, 
                reason: `Nouveau record de série : ${currentStreak} jours` 
            });
            alert(`Félicitations ! Nouveau record de série : ${currentStreak} jours ! Vous gagnez ${POINTS_CONFIG.newStreakRecord} points !`);
        }
        
        // --- 3. Réinitialisation des tâches récurrentes ---
        tasks = tasks.map(task => {
            if (task.isRecurring && task.completed) {
                return { ...task, completed: false };
            }
            return task;
        });

        lastCheckDate = todayStr;
        
        if (appSettings.socialShareEnabled) {
             saveFirebaseState('stats', { currentStreak, maxStreak, totalPoints });
             saveFirebaseState('streakHistory', streakHistory);
             syncLocalToFirebase(); 
        } else {
             saveLocalData();
        }
    }
    
    tasks.filter(t => t.dueTime && !t.completed).forEach(scheduleTaskNotification);
}

/** Ajoute une nouvelle tâche. */
async function addTask() {
    const input = document.getElementById('new-task');
    const difficultySelect = document.getElementById('task-difficulty');
    const recurringToggle = document.getElementById('is-recurring');
    const recurrenceType = document.getElementById('recurrence-type');
    const recurrenceValue = document.getElementById('recurrence-value');
    const dueTimeInput = document.getElementById('due-time');
    
    const text = input.value.trim();
    const difficulty = difficultySelect.value;
    const points = POINTS_CONFIG[difficulty];

    if (text) {
        const taskId = Date.now().toString(); 
        
        const newTaskData = {
            id: taskId,
            text: text,
            completed: false,
            difficulty: difficulty,
            points: points,
            createdAt: new Date().getTime(),
            isRecurring: recurringToggle.checked,
            recurrenceType: recurringToggle.checked ? recurrenceType.value : null,
            recurrenceValue: recurringToggle.checked ? parseInt(recurrenceValue.value) : 1,
            dueTime: dueTimeInput.value || null
        };

        if (appSettings.socialShareEnabled) {
            const tasksRef = window.ref(window.db, TASKS_PATH);
            try {
                await window.push(tasksRef, { ...newTaskData, id: null });
                input.value = '';
                dueTimeInput.value = '';
                recurringToggle.checked = false;
                document.getElementById('recurrence-options').style.display = 'none';
            } catch (e) {
                console.error("Erreur Firebase:", e);
                alert("Erreur réseau: impossible d'ajouter la tâche au serveur.");
            }
        } else {
            tasks.push(newTaskData);
            input.value = '';
            dueTimeInput.value = '';
            recurringToggle.checked = false;
            document.getElementById('recurrence-options').style.display = 'none';
            saveLocalData();
            updateUI();
        }
    }
}

/** Bascule l'état de complétion d'une tâche. */
async function toggleTaskCompletion(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedStatus = !task.completed;
    let pointsChange = 0;

    if (newCompletedStatus) {
        pointsChange = task.points;
        pointsHistory.push({ 
            date: new Date().toLocaleDateString('fr-FR'), 
            points: task.points, 
            reason: `Tâche complétée: "${task.text}"` 
        });
        triggerHaptics('success');
    } else {
        pointsChange = -task.points;
        triggerHaptics('error');
    }
    totalPoints += pointsChange;

    task.completed = newCompletedStatus;

    if (appSettings.socialShareEnabled) {
        const taskRef = window.ref(window.db, `${TASKS_PATH}/${taskId}`);
        try {
            await window.set(taskRef, task); 
            await saveFirebaseState('stats', { currentStreak, maxStreak, totalPoints });
            await saveFirebaseState('pointsHistory', pointsHistory);
        } catch (e) {
            console.error("Erreur Firebase:", e);
        }
    } else {
        saveLocalData();
        updateUI();
    }
}


/** Archive une tâche. */
async function archiveTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const taskToArchive = tasks[taskIndex];

    if (appSettings.socialShareEnabled) {
        const taskRef = window.ref(window.db, `${TASKS_PATH}/${taskId}`);
        const archiveRef = window.ref(window.db, ARCHIVE_PATH);

        try {
            await window.push(archiveRef, { ...taskToArchive, archivedDate: new Date().toLocaleDateString('fr-FR') });
            await window.remove(taskRef);
        } catch (e) {
            console.error("Erreur Firebase:", e);
            alert("Erreur réseau: impossible d'archiver la tâche.");
        }
    } else {
        tasks.splice(taskIndex, 1);
        archive.push({ ...taskToArchive, archivedDate: new Date().toLocaleDateString('fr-FR') });
        saveLocalData();
        updateUI();
    }
}

/** Restaure une tâche depuis l'archive. */
async function restoreTask(taskId) {
    const taskIndex = archive.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const taskToRestore = archive[taskIndex];
    delete taskToRestore.archivedDate;
    
    if (appSettings.socialShareEnabled) {
        const tasksRef = window.ref(window.db, `${TASKS_PATH}/${taskId}`);
        await window.set(tasksRef, taskToRestore);
        
        const newArchive = archive.filter(t => t.id !== taskId);
        await saveFirebaseState('archive', newArchive);

    } else {
        archive.splice(taskIndex, 1);
        tasks.push(taskToRestore);
        saveLocalData();
        updateUI();
    }
}


// --- 4. Logique de la Boutique et du Profil ---

/** Acheter un article. */
function buyItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    if (item.owned) {
        if (item.type === 'icon') {
            profile.icon = item.value;
            saveLocalData();
            updateUI();
            alert(`Icône ${item.value} équipée !`);
        } else {
             alert(`${item.name} déjà possédé ou utilitaire utilisé !`);
        }
        return;
    }

    if (totalPoints >= item.cost) {
        totalPoints -= item.cost;
        item.owned = true;
        
        if (item.type === 'icon') {
            profile.icon = item.value; 
        } else if (item.type === 'utility' && item.value === 'reset_streak') {
            currentStreak = 1; // Commence une nouvelle série de 1
            alert("Série réinitialisée ! Votre nouvelle série est de 1.");
        }
        
        saveLocalData();
        updateUI();
        triggerHaptics('success');
        alert(`Achat réussi : ${item.name} ! ${item.cost} points dépensés.`);
    } else {
        alert(`Points insuffisants ! Il vous manque ${item.cost - totalPoints} points. Vous avez ${totalPoints}.`);
    }
}

/** Partager le profil. */
function shareProfile() {
    const currentLevel = calculateLevel();
    const profileText = `Mon Profil de Gestion de Tâches :\nNiveau ${currentLevel} (${totalPoints} points)\nSérie Max : ${maxStreak} jours\nIcône Actuelle : ${profile.icon}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Mon Profil de Tâches Gamifié',
            text: profileText
        }).then(() => console.log('Partage de profil réussi'))
          .catch((error) => console.log('Erreur de partage', error));
    } else {
        prompt("Copiez ce texte pour partager votre profil :", profileText);
    }
}


// --- 5. Sauvegarde/Restauration Manuelle ---

/** Exporter les données. */
function exportData() {
    const data = {
        tasks, archive, currentStreak, maxStreak, totalPoints,
        streakHistory, pointsHistory, appSettings, shopItems, profile
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo_data_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Données exportées avec succès !');
}

/** Importer les données. */
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            tasks = importedData.tasks || [];
            archive = importedData.archive || [];
            currentStreak = importedData.currentStreak || 0;
            maxStreak = importedData.maxStreak || 0;
            totalPoints = importedData.totalPoints || 0;
            streakHistory = importedData.streakHistory || [];
            pointsHistory = importedData.pointsHistory || [];
            appSettings = { ...appSettings, ...importedData.appSettings };
            shopItems = importedData.shopItems || [];
            profile = { ...profile, ...importedData.profile };
            
            saveLocalData();
            alert('Données importées et sauvegardées !');
            window.location.reload(); 
        } catch (error) {
            alert('Erreur: Le fichier n\'est pas un JSON valide ou est corrompu.');
            console.error(error);
        }
    };
    reader.readAsText(file);
}


// --- 6. Gestion des Filtres, Tri et Navigation ---

/** Définir le filtre (all ou todo). CORRIGÉ POUR LE BUG */
function setTaskFilter(filter) {
    currentFilter = filter;
    
    // Mettre à jour l'état visuel du bouton
    document.querySelectorAll('.tasks-controls button').forEach(btn => btn.classList.remove('active'));
    
    const filterBtn = document.getElementById(`filter-${filter}`);
    if(filterBtn) {
        filterBtn.classList.add('active');
    }
    
    updateUI(); 
}

/** Définir le tri. */
function setTaskSort(sort) {
    currentSort = sort;
    updateUI();
}

/** Gère l'affichage des différents écrans (onglets). */
function showScreen(screenId, clickedButton) {
    // Masquer tous les écrans principaux
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active-screen');
        screen.classList.add('hidden-screen');
    });

    // Afficher l'écran demandé
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden-screen');
        targetScreen.classList.add('active-screen');
    }

    // Mettre à jour les boutons de navigation
    document.querySelectorAll('.bottom-nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    // Si c'est l'écran des tâches, on s'assure que le filtre est bien appliqué
    if (screenId === 'tasks-screen' || screenId === 'history-section') {
        updateUI(); 
    }
}

/** Bascule l'affichage du menu/modal (utilisé pour les Réglages). */
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.toggle('hidden');
}


// --- 7. Notifications et Haptics ---

/** Planifie la notification d'échéance. */
function scheduleTaskNotification(task) {
    if (!task.dueTime) return;

    const [hour, minute] = task.dueTime.split(':').map(Number);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const dueDate = new Date(today);
    dueDate.setHours(hour, minute, 0, 0);

    const notificationTime = new Date(dueDate.getTime() - appSettings.notificationLeadTimeMinutes * 60000);

    if (notificationTime <= now) return;

    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gonative) {
        window.webkit.messageHandlers.gonative.postMessage({
            command: 'scheduleNotification',
            arguments: {
                id: task.id,
                title: "⚠️ URGENT: Heure Limite Approche",
                body: `La tâche "${task.text}" est due dans ${appSettings.notificationLeadTimeMinutes} minutes !`,
                time: notificationTime.toISOString(),
            }
        });
        console.log(`Notification planifiée pour la tâche ${task.id} à ${notificationTime.toLocaleTimeString()}`);
    } else {
        console.log(`[Simulation] Notification planifiée pour ${task.text} à ${notificationTime.toLocaleTimeString()}`);
    }
}

/** Déclenche un retour haptique (vibration) via le pont Median.co. */
function triggerHaptics(type = 'success') {
    if (!appSettings.hapticsEnabled) return; 

    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gonative) {
        let feedbackType = 'impactLight'; 
        if (type === 'success') feedbackType = 'notificationSuccess'; 
        if (type === 'error') feedbackType = 'notificationError';

        window.webkit.messageHandlers.gonative.postMessage({
            command: 'hapticEngine',
            arguments: {
                feedback: feedbackType
            }
        });
    }
}


// --- 8. Mise à Jour de l'Interface Utilisateur (UI) ---

/** Met à jour tous les éléments d'affichage. */
function updateUI() {
    // 1. Mise à jour des statistiques et du niveau
    const currentLevel = calculateLevel();
    document.getElementById('current-streak').textContent = currentStreak;
    document.getElementById('max-streak').textContent = maxStreak;
    document.getElementById('total-points').textContent = totalPoints;
    
    document.getElementById('level-display').textContent = `Niv. ${currentLevel}`;
    document.getElementById('profile-icon').textContent = profile.icon;
    document.getElementById('current-profile-icon').textContent = profile.icon;
    document.getElementById('profile-level').textContent = currentLevel;
    document.getElementById('profile-points').textContent = totalPoints;
    document.getElementById('profile-max-streak').textContent = maxStreak;


    // 2. Préparation pour le tri et le filtre
    let displayTasks = tasks.slice();
    
    // A. Filtrage
    if (currentFilter === 'todo') {
        displayTasks = displayTasks.filter(t => !t.completed);
    }
    
    // B. Tri
    if (currentSort === 'difficulty') {
        displayTasks.sort((a, b) => POINTS_CONFIG[b.difficulty] - POINTS_CONFIG[a.difficulty]);
    } else if (currentSort === 'time') {
        displayTasks.sort((a, b) => {
            if (!a.dueTime && !b.dueTime) return 0;
            if (!a.dueTime) return 1; 
            if (!b.dueTime) return -1;
            return a.dueTime.localeCompare(b.dueTime);
        });
    }


    // 3. Afficher la liste des tâches
    const taskListElement = document.getElementById('tasks-list');
    taskListElement.innerHTML = '';
    
    if (displayTasks.length === 0) {
        taskListElement.innerHTML = `<li>${currentFilter === 'todo' ? '🎉 Toutes les tâches actives sont faites !' : 'Aucune tâche à afficher.'}</li>`;
    }

    displayTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        
        let recurrenceBadge = '';
        if (task.isRecurring) {
             recurrenceBadge = `<span class="badge recurrence-badge">🔁 Tous les ${task.recurrenceValue} ${task.recurrenceType.replace('ly', 's').replace('daily', 'jour(s)')}</span>`;
        }
        
        let timeBadge = '';
        if (task.dueTime) {
             timeBadge = `<span class="badge time-badge">⏰ Avant ${task.dueTime}</span>`;
        }
        
        li.innerHTML = `
            <div class="task-info">
                <span>${task.text}</span>
                <div class="task-metadata">
                    <span class="task-difficulty">Difficulté: ${task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)} (+${task.points} pts)</span>
                    ${recurrenceBadge}
                    ${timeBadge}
                </div>
            </div>
            <div class="task-actions">
                <button class="complete-btn" onclick="toggleTaskCompletion('${task.id}')">
                    ${task.completed ? 'Annuler' : 'Fait ✅'}
                </button>
                <button class="edit-btn" onclick="editTask('${task.id}')">Modifier ✏️</button>
                
                ${task.completed ? 
                    `<button class="delete-btn" onclick="archiveTask('${task.id}')">Archiver 📦</button>` 
                    : ''}
            </div>
        `;
        taskListElement.appendChild(li);
    });

    // 4. Afficher la liste des archives (section historique)
    const archiveListElement = document.getElementById('archive-list');
    archiveListElement.innerHTML = '';
    if (archive.length === 0) {
        archiveListElement.innerHTML = '<li>L\'archive est vide.</li>';
    }
    archive.slice(-10).reverse().forEach(item => { 
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.archivedDate}: "${item.text}" - ${item.completed ? '✅ Fait' : '❌ Non fait'}</span>
            <button class="restore-btn" onclick="restoreTask('${item.id}')">Restaurer ↩️</button>
        `;
        archiveListElement.appendChild(li);
    });
    
    
    // 5. Afficher la boutique
    const shopListElement = document.getElementById('shop-items-list');
    shopListElement.innerHTML = '';
    shopItems.forEach(item => {
        const li = document.createElement('li');
        const actionText = item.owned ? (item.type === 'icon' && profile.icon === item.value ? 'Équipé' : 'Équiper') : `Acheter (${item.cost} Pts)`;
        const buttonClass = item.owned ? 'equip-btn' : 'buy-btn';
        
        li.innerHTML = `
            <div class="item-info">
                <span>${item.value} ${item.name}</span>
                <p>${item.description || ''}</p>
            </div>
            <button class="${buttonClass}" 
                    ${item.owned && item.type === 'icon' && profile.icon === item.value ? 'disabled' : ''}
                    onclick="buyItem(${item.id})">
                ${actionText}
            </button>
        `;
        shopListElement.appendChild(li);
    });

}

// Placeholder pour l'édition de tâche
function editTask(taskId) {
    alert(`Fonctionnalité d'édition de la tâche ${taskId} à implémenter.`)
}

function saveSettings() {
    const oldSyncStatus = appSettings.socialShareEnabled;
    
    appSettings.hapticsEnabled = document.getElementById('haptics-toggle').checked;
    appSettings.socialShareEnabled = document.getElementById('social-share-toggle').checked;
    
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
    
    alert('Réglages sauvegardés !');
    
    if (appSettings.socialShareEnabled && !oldSyncStatus) {
        alert("Synchronisation activée. Tentative d'envoi des données locales à Firebase...");
        loadData(); 
    } else if (!appSettings.socialShareEnabled && oldSyncStatus) {
        alert("Synchronisation désactivée. Passage en mode local.");
        loadTasksFromLocal(); 
    }
}

function loadSettingsUI() {
    document.getElementById('haptics-toggle').checked = appSettings.hapticsEnabled;
    document.getElementById('social-share-toggle').checked = appSettings.socialShareEnabled;
}


// --- 9. Exécution au Chargement ---

document.addEventListener('DOMContentLoaded', () => {
    loadData(); 
    checkRecurrenceAndDailyReset(); 

    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    // Assurer que le premier écran est bien actif au chargement
    showScreen('tasks-screen', document.querySelector('.bottom-nav button:first-child'));
});
