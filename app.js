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

// Identifiant de l'utilisateur pour Firebase (doit être unique)
// Pour le moment, nous utilisons un ID MOCK, mais il devrait être généré ou associé à un login.
const USER_ID = "mock_user_123"; 

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
    socialShareEnabled: false // DÉTERMINE SI LA SYNCHRO EST ACTIVE
};


// --- 2. Fonctions de Stockage (Local / Firebase) ---

/** Charge toutes les données depuis localStorage ou Firebase. */
function loadData() {
    loadLocalData(); // Charger les settings et la date de vérification
    
    if (appSettings.socialShareEnabled) {
        setupFirebaseListener();
    } else {
        loadTasksFromLocal();
    }
}

/** Charge les données qui restent locales (Réglages et Date de Vérification). */
function loadLocalData() {
    const loadedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
    appSettings = { ...appSettings, ...loadedSettings };
    lastCheckDate = localStorage.getItem(STORAGE_KEYS.LAST_CHECK);
}

/** Charge les tâches depuis localStorage (mode local). */
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


// --- 3. Synchronisation en Temps Réel (Firebase RTDB) ---

/** Initialise l'écouteur pour Firebase RTDB. */
function setupFirebaseListener() {
    if (!window.db) {
        alert("Erreur: Firebase RTDB non initialisée. Vérifiez la configuration.");
        return;
    }
    
    // Référence à la branche de données de l'utilisateur
    const userRef = window.ref(window.db, `users/${USER_ID}`);

    window.onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
            // Charger les tâches
            tasks = data.tasks ? Object.keys(data.tasks).map(key => ({ ...data.tasks[key], id: key })) : [];
            
            // Charger les autres données (simulé)
            currentStreak = data.stats ? data.stats.currentStreak || 0 : 0;
            maxStreak = data.stats ? data.stats.maxStreak || 0 : 0;
            totalPoints = data.stats ? data.stats.totalPoints || 0 : 0;
            
            // NOTE: Pour simplifier, nous ne synchronisons pas l'archive/historique ici.
        } else {
            // Si aucune donnée n'existe pour cet ID, on pousse les données locales
            syncLocalToFirebase();
        }

        updateUI(); 
    }, (error) => {
        console.error("Erreur de connexion Firebase (vérifiez la connexion/règles) :", error);
        alert("Erreur de synchronisation Firebase. Tâches chargées localement.");
        // Revenir en mode local en cas d'échec
        appSettings.socialShareEnabled = false;
        loadTasksFromLocal();
        updateUI();
    });
}

/** Pousse l'ensemble des données locales vers Firebase (première synchronisation). */
async function syncLocalToFirebase() {
    console.log("Synchronisation initiale des données locales vers Firebase...");
    const userRef = window.ref(window.db, `users/${USER_ID}`);

    // Convertir les tâches (sans l'ID temporaire) en un format RTDB
    const tasksData = tasks.reduce((acc, task) => {
        acc[task.id] = { 
            text: task.text, 
            completed: task.completed, 
            difficulty: task.difficulty, 
            points: task.points 
        };
        return acc;
    }, {});
    
    const dataToSync = {
        tasks: tasksData,
        stats: {
            currentStreak,
            maxStreak,
            totalPoints
        },
        // archive, streakHistory, pointsHistory devraient être inclus ici pour la complétude
    };

    try {
        await window.set(userRef, dataToSync);
    } catch (e) {
        console.error("Erreur de synchronisation :", e);
        alert("Erreur lors de la synchronisation initiale. Vérifiez votre connexion.");
    }
}


/** Sauvegarde un état (tâches, stats) sur Firebase. */
async function saveFirebaseState(path, data) {
    if (!appSettings.socialShareEnabled) return; // Ne rien faire si la synchro est désactivée

    const fullPath = `users/${USER_ID}/${path}`;
    const dataRef = window.ref(window.db, fullPath);

    try {
        await window.set(dataRef, data);
    } catch (e) {
        console.error(`Erreur d'écriture sur Firebase à ${fullPath}:`, e);
        alert(`Erreur réseau. Impossible de sauvegarder les données.`);
    }
}


// --- 4. Logique de l'Application (Tâches, Série, Points) ---

/** Vérifie et gère la réinitialisation quotidienne. */
function checkDailyReset() {
    // ... [Logique inchangée, elle utilise les variables globales tasks, currentStreak, etc.]
    // ... [Elle devra appeler saveLocalData() OU saveFirebaseState('stats', { ... })]
}

/** Ajoute une nouvelle tâche. */
async function addTask() {
    const input = document.getElementById('new-task');
    const difficultySelect = document.getElementById('task-difficulty');
    const text = input.value.trim();
    const difficulty = difficultySelect.value;
    const points = POINTS_CONFIG[difficulty];

    if (text) {
        const newTaskData = {
            text: text,
            completed: false,
            difficulty: difficulty,
            points: points,
            createdAt: new Date().getTime()
        };

        if (appSettings.socialShareEnabled) {
            // Pousser vers Firebase, push génère la clé unique
            const tasksRef = window.ref(window.db, `users/${USER_ID}/tasks`);
            try {
                await window.push(tasksRef, newTaskData);
                input.value = '';
                // L'écouteur onValue mettra à jour l'UI
            } catch (e) {
                console.error("Erreur Firebase:", e);
                alert("Erreur réseau: impossible d'ajouter la tâche au serveur.");
            }
        } else {
            // Mode local
            tasks.push({ ...newTaskData, id: Date.now().toString() });
            input.value = '';
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

    if (appSettings.socialShareEnabled) {
        const taskRef = window.ref(window.db, `users/${USER_ID}/tasks/${taskId}`);
        try {
            // Mettre à jour seulement le champ 'completed'
            await window.set(taskRef, { ...task, completed: newCompletedStatus }); 
        } catch (e) {
            console.error("Erreur Firebase:", e);
            alert("Erreur réseau: impossible de mettre à jour le statut.");
        }
    } else {
        // Mode local
        task.completed = newCompletedStatus;
        saveLocalData();
        updateUI();
    }

    // Gestion des points (reste locale pour l'historique)
    if (newCompletedStatus) {
        totalPoints += task.points;
        triggerHaptics('success');
    } else {
        totalPoints -= task.points;
        triggerHaptics('error');
    }
    // Mise à jour de la synchro des stats
    if (appSettings.socialShareEnabled) {
        saveFirebaseState('stats', { currentStreak, maxStreak, totalPoints });
    } else {
        saveLocalData();
    }
}


/** Édite le texte d'une tâche. */
async function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newText = prompt(`Modifier la tâche "${task.text}" :`, task.text);
    if (newText && newText.trim() !== "") {
        if (appSettings.socialShareEnabled) {
            const taskRef = window.ref(window.db, `users/${USER_ID}/tasks/${taskId}`);
            try {
                // Mettre à jour seulement le champ 'text'
                await window.set(taskRef, { ...task, text: newText.trim() });
            } catch (e) {
                console.error("Erreur Firebase:", e);
                alert("Erreur réseau: impossible d'éditer la tâche.");
            }
        } else {
            // Mode local
            task.text = newText.trim();
            saveLocalData();
            updateUI();
        }
    }
}

/** Archive une tâche. */
async function archiveTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const taskToArchive = tasks[taskIndex];

    if (appSettings.socialShareEnabled) {
        const taskRef = window.ref(window.db, `users/${USER_ID}/tasks/${taskId}`);
        const archiveRef = window.ref(window.db, `users/${USER_ID}/archive`);

        try {
            // 1. Ajouter à la collection d'archives
            await window.push(archiveRef, {
                ...taskToArchive,
                archivedDate: new Date().toLocaleDateString('fr-FR')
            });

            // 2. Supprimer de la collection active
            await window.remove(taskRef);
        } catch (e) {
            console.error("Erreur Firebase:", e);
            alert("Erreur réseau: impossible d'archiver la tâche.");
        }
    } else {
        // Mode local
        tasks.splice(taskIndex, 1);
        archive.push({
            ...taskToArchive,
            archivedDate: new Date().toLocaleDateString('fr-FR')
        });
        saveLocalData();
        updateUI();
    }
}

// --- 5. Gestion des Réglages (Mise à jour de la synchro) ---

/** Sauvegarde l'état des réglages et gère la bascule Sync/Local. */
function saveSettings() {
    const oldSyncStatus = appSettings.socialShareEnabled;
    
    appSettings.hapticsEnabled = document.getElementById('haptics-toggle').checked;
    appSettings.socialShareEnabled = document.getElementById('social-share-toggle').checked;
    
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
    
    alert('Réglages sauvegardés !');
    
    // Gérer la bascule de synchronisation
    if (appSettings.socialShareEnabled && !oldSyncStatus) {
        // Passage de Local à Sync
        alert("Synchronisation activée. Tentative d'envoi des données locales à Firebase...");
        loadData(); // Re-charge pour activer le listener et synchroniser
    } else if (!appSettings.socialShareEnabled && oldSyncStatus) {
        // Passage de Sync à Local
        alert("Synchronisation désactivée. Passage en mode local.");
        loadTasksFromLocal(); // Ramène les données dans le local storage
    }
}

// ... [loadSettingsUI, toggleSettingsMenu, shareLocalStats, updateUI, displayHistory, 
//      triggerHaptics, showObjectiveNotification, checkNotificationTime, checkDailyReset restent les mêmes, 
//      mais appelleront la nouvelle logique de sauvegarde] ...

// --- 6. Exécution au Chargement ---

document.addEventListener('DOMContentLoaded', () => {
    loadLocalData(); // Charger les settings
    loadSettingsUI(); // Charger l'UI des settings
    
    // Charger toutes les autres données (soit localement, soit via Firebase)
    loadData(); 

    // checkDailyReset(); 

    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    // ... [Reste du code d'initialisation]
});
