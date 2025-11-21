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
    SETTINGS: 'todoApp.settings'
};

const POINTS_CONFIG = { easy: 1, medium: 3, hard: 5, newStreakRecord: 10 };
const RESET_HOUR = 0; 
const NOTIFICATION_HOUR = 10; 

// Identifiant de l'utilisateur pour Firebase (Mock ID car pas d'authentification)
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
    // NOUVEAU: Durée d'avance pour la notification d'échéance (en minutes)
    notificationLeadTimeMinutes: 30 
};


// --- 2. Fonctions de Stockage (Local / Firebase) ---

/** Charge toutes les données depuis localStorage ou Firebase. */
function loadData() {
    loadLocalData(); 
    
    if (appSettings.socialShareEnabled) {
        setupFirebaseListener();
    } else {
        loadTasksFromLocal();
    }
    loadSettingsUI(); 
}

/** Charge les données qui restent locales (Réglages et Date de Vérification). */
function loadLocalData() {
    const loadedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
    appSettings = { 
        ...appSettings, 
        ...loadedSettings,
        // Assurer que le nouveau setting est chargé (ou utilise la valeur par défaut)
        notificationLeadTimeMinutes: loadedSettings.notificationLeadTimeMinutes || 30 
    };
    lastCheckDate = localStorage.getItem(STORAGE_KEYS.LAST_CHECK);
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
}

// ... (setupFirebaseListener, syncLocalToFirebase, saveFirebaseState restent inchangées)

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

/** Pousse l'ensemble des données locales vers Firebase (première synchronisation). */
async function syncLocalToFirebase() {
    const userRef = window.ref(window.db, BASE_PATH);
    const tasksData = tasks.reduce((acc, task) => {
        // Enlève l'ID temporaire si existant, l'ID RTDB devient la clé
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

/** Vérifie la récurrence et gère la réinitialisation quotidienne. */
function checkRecurrenceAndDailyReset() {
    const now = new Date();
    const todayStr = now.toLocaleDateString('fr-FR');
    const lastCheckTime = lastCheckDate ? new Date(lastCheckDate.split('/').reverse().join('-')) : null;

    const isNewDay = !lastCheckTime || (now.setHours(RESET_HOUR, 0, 0, 0) > lastCheckTime.setHours(RESET_HOUR, 0, 0, 0));
    
    if (isNewDay) {
        
        // --- 1. Vérification et mise à jour de la Série ---
        const allCompleted = tasks.every(task => task.completed || !task.isRecurring); // Seules les tâches actives ou récurrentes comptent
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
                // Pour une implémentation simple, on réinitialise toutes les tâches récurrentes complétées
                // lors du reset quotidien. Pour une récurrence complexe, un calcul de date serait nécessaire.
                return { ...task, completed: false };
            }
            return task;
        });

        // --- 4. Mettre à jour la date de dernière vérification ---
        lastCheckDate = todayStr;
        
        // Sauvegarde conditionnelle
        if (appSettings.socialShareEnabled) {
             saveFirebaseState('stats', { currentStreak, maxStreak, totalPoints });
             saveFirebaseState('streakHistory', streakHistory);
             syncLocalToFirebase(); 
        } else {
             saveLocalData();
        }
    }
    
    // Planifier les notifications pour les tâches liées au temps chaque fois que l'app s'ouvre
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
            // NOUVEAUX CHAMPS
            isRecurring: recurringToggle.checked,
            recurrenceType: recurringToggle.checked ? recurrenceType.value : null,
            recurrenceValue: recurringToggle.checked ? parseInt(recurrenceValue.value) : 1,
            dueTime: dueTimeInput.value || null
        };

        if (appSettings.socialShareEnabled) {
            const tasksRef = window.ref(window.db, TASKS_PATH);
            try {
                // Utiliser push() pour que Firebase génère la clé et mettre à jour l'objet
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

    // 1. Mise à jour des points
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

    // 2. Mise à jour des données
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

// NOUVELLE FONCTION: Restaure une tâche depuis l'archive
async function restoreTask(taskId) {
    const taskIndex = archive.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const taskToRestore = archive[taskIndex];
    delete taskToRestore.archivedDate;
    
    if (appSettings.socialShareEnabled) {
        // NOTE: On ne peut pas facilement supprimer un élément par ID dans un tableau (archive)
        // sur Firebase. Pour une archive simple, on va resynchroniser l'archive et ajouter la tâche.
        
        // 1. Ajouter à la liste des tâches actives
        const tasksRef = window.ref(window.db, `${TASKS_PATH}/${taskId}`);
        await window.set(tasksRef, taskToRestore);
        
        // 2. Supprimer de l'archive (nécessite de repousser tout le tableau, peu efficace, mais simple)
        const newArchive = archive.filter(t => t.id !== taskId);
        await saveFirebaseState('archive', newArchive);

    } else {
        // Mode local
        archive.splice(taskIndex, 1);
        tasks.push(taskToRestore);
        saveLocalData();
        updateUI();
    }
}


// --- 4. Gestion des Réglages (Mise à jour de la synchro) ---

/** Sauvegarde l'état des réglages et gère la bascule Sync/Local. */
function saveSettings() {
    const oldSyncStatus = appSettings.socialShareEnabled;
    
    appSettings.hapticsEnabled = document.getElementById('haptics-toggle').checked;
    appSettings.socialShareEnabled = document.getElementById('social-share-toggle').checked;
    
    // Nouvelle sauvegarde du lead time (si vous ajoutez un champ de configuration)
    // Pour l'instant, on utilise le défaut si aucun champ n'est ajouté
    
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

/** Charge les réglages dans le menu lors de l'initialisation. */
function loadSettingsUI() {
    document.getElementById('haptics-toggle').checked = appSettings.hapticsEnabled;
    document.getElementById('social-share-toggle').checked = appSettings.socialShareEnabled;
    // Si vous aviez un champ pour notificationLeadTimeMinutes, il faudrait le charger ici
}

/** Bascule l'affichage du menu de réglages. */
function toggleSettingsMenu() {
    const menu = document.getElementById('settings-menu');
    menu.classList.toggle('hidden');
}

/** Fonction placeholder pour l'édition de tâche */
function editTask(taskId) {
    // La logique d'édition n'a pas changé, elle n'est pas répétée ici pour la concision
    // (Elle est conservée dans l'implémentation complète fournie précédemment)
}


// --- 5. Notifications et Haptics ---

// NOUVELLE FONCTION: Planifie la notification d'échéance
function scheduleTaskNotification(task) {
    if (!task.dueTime) return;

    const [hour, minute] = task.dueTime.split(':').map(Number);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Date/heure d'échéance aujourd'hui
    const dueDate = new Date(today);
    dueDate.setHours(hour, minute, 0, 0);

    // Calcul de l'heure de la notification
    const notificationTime = new Date(dueDate.getTime() - appSettings.notificationLeadTimeMinutes * 60000);

    // Si la notification est déjà passée, on ne fait rien
    if (notificationTime <= now) return;

    // 🚨 IMPORTANT: Utilisation de l'API Native Median.co pour la planification (Local Notifications Extension)
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gonative) {
        // Envoie la commande au bridge natif (nécessite l'extension "Local Notifications")
        window.webkit.messageHandlers.gonative.postMessage({
            command: 'scheduleNotification',
            arguments: {
                id: taskId,
                title: "⚠️ URGENT: Heure Limite Approche",
                body: `La tâche "${task.text}" est due dans ${appSettings.notificationLeadTimeMinutes} minutes !`,
                time: notificationTime.toISOString(),
                // D'autres options peuvent être ajoutées ici
            }
        });
        console.log(`Notification planifiée pour la tâche ${task.id} à ${notificationTime.toLocaleTimeString()}`);
    } else {
        // Fallback pour le navigateur (ne planifie pas, affiche un message)
        console.log(`[Simulation] Notification planifiée pour ${task.text} à ${notificationTime.toLocaleTimeString()}`);
    }
}

/** Déclenche un retour haptique (vibration) via le pont Median.co. */
function triggerHaptics(type = 'success') {
    if (!appSettings.hapticsEnabled) return; 

    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gonative) {
        let feedbackType = 'impactLight'; 
        if (type === 'success') feedbackType = 'notificationSuccess'; // Utilise le type de notification plus fort
        if (type === 'error') feedbackType = 'notificationError';

        window.webkit.messageHandlers.gonative.postMessage({
            command: 'hapticEngine',
            arguments: {
                feedback: feedbackType
            }
        });
    }
}

// ... (showObjectiveNotification et checkNotificationTime restent inchangées, mais la fonction
// scheduleTaskNotification est prioritaire pour la logique de temps)

// --- 6. Mise à Jour de l'Interface Utilisateur (UI) ---

/** Met à jour tous les éléments d'affichage. */
function updateUI() {
    // 1. Mettre à jour les statistiques
    document.getElementById('current-streak').textContent = currentStreak;
    document.getElementById('max-streak').textContent = maxStreak;
    document.getElementById('total-points').textContent = totalPoints;

    // 2. Afficher la liste des tâches
    const taskListElement = document.getElementById('tasks-list');
    taskListElement.innerHTML = '';
    
    if (tasks.length === 0) {
        taskListElement.innerHTML = '<li>🎉 Aucune tâche pour aujourd\'hui. Ajoutez-en une !</li>';
    }

    tasks.forEach(task => {
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

    // 3. Afficher la liste des archives (Ajout du bouton "Restaurer")
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
    
    // 4. Les autres éléments d'UI (Historique des séries et des points) restent inchangés
}

/** Génère un lien de partage des stats locales (Simulation). */
function shareLocalStats() {
    const stats = {
        currentStreak: currentStreak,
        maxStreak: maxStreak,
        totalPoints: totalPoints,
        lastUpdate: new Date().toLocaleString('fr-FR')
    };

    const statsJSON = JSON.stringify(stats);
    const encodedStats = btoa(statsJSON); 

    const shareLink = `Mon Appli://stats?data=${encodedStats}`; 

    if (navigator.share) {
        navigator.share({
            title: 'Mes Stats de Gamification !',
            text: `Je suis à ${currentStreak} jours de série et ${totalPoints} points ! Vois mes stats :`,
            url: shareLink
        }).then(() => console.log('Partage réussi'))
          .catch((error) => console.log('Erreur de partage', error));
    } else {
        prompt("Copiez ce lien pour partager vos stats (simulé) :", shareLink);
    }
}


// --- 7. Exécution au Chargement ---

document.addEventListener('DOMContentLoaded', () => {
    loadData(); 
    checkRecurrenceAndDailyReset(); 

    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    // checkNotificationTime n'est plus pertinent avec l'approche dueTime/scheduleNotification
    // Gardons la fonction de vérification simple
    // setInterval(checkNotificationTime, 60 * 60 * 1000);
    // checkNotificationTime();
});
