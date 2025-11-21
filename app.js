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

// NOUVEAUX CHEMINS DE BASE DANS LA RTDB (Todo Tasks)
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
    socialShareEnabled: false // DÉTERMINE SI LA SYNCHRO EST ACTIVE
};


// --- 2. Fonctions de Stockage (Local / Firebase) ---

/** Charge toutes les données depuis localStorage ou Firebase. */
function loadData() {
    loadLocalData(); // Charger les settings et la date de vérification
    
    // Si la synchronisation est activée, on bascule vers Firebase
    if (appSettings.socialShareEnabled) {
        setupFirebaseListener();
    } else {
        loadTasksFromLocal();
    }
    loadSettingsUI(); // Mettre à jour l'UI des réglages
}

/** Charge les données qui restent locales (Réglages et Date de Vérification). */
function loadLocalData() {
    const loadedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
    appSettings = { ...appSettings, ...loadedSettings };
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


// --- 3. Synchronisation en Temps Réel (Firebase RTDB) ---

/** Initialise l'écouteur pour Firebase RTDB. */
function setupFirebaseListener() {
    if (!window.db) {
        alert("Erreur: Firebase RTDB non initialisée. Vérifiez la configuration dans index.html.");
        return;
    }
    
    const userRef = window.ref(window.db, BASE_PATH);

    window.onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
            // Charger les tâches
            tasks = data.tasks ? Object.keys(data.tasks).map(key => ({ ...data.tasks[key], id: key })) : [];
            
            // Charger les stats
            currentStreak = data.stats ? data.stats.currentStreak || 0 : 0;
            maxStreak = data.stats ? data.stats.maxStreak || 0 : 0;
            totalPoints = data.stats ? data.stats.totalPoints || 0 : 0;
            
            // Charger l'historique
            archive = data.archive ? Object.values(data.archive) : [];
            streakHistory = data.streakHistory ? Object.values(data.streakHistory) : [];
            pointsHistory = data.pointsHistory ? Object.values(data.pointsHistory) : [];
        } else {
            // Si aucune donnée n'existe pour cet ID sur Firebase, on pousse les données locales
            syncLocalToFirebase();
        }

        updateUI(); 
    }, (error) => {
        console.error("Erreur de connexion Firebase (vérifiez la connexion/règles) :", error);
        alert("Erreur de synchronisation Firebase. Reversion en mode local.");
        
        // Revenir en mode local en cas d'échec
        appSettings.socialShareEnabled = false;
        loadTasksFromLocal();
        updateUI();
    });
}

/** Pousse l'ensemble des données locales vers Firebase (première synchronisation). */
async function syncLocalToFirebase() {
    console.log("Synchronisation initiale des données locales vers Firebase...");
    const userRef = window.ref(window.db, BASE_PATH);

    // Convertir les tâches (sans l'ID temporaire) en un format RTDB
    const tasksData = tasks.reduce((acc, task) => {
        // L'ID est la clé, le reste est la valeur
        acc[task.id] = { 
            text: task.text, 
            completed: task.completed, 
            difficulty: task.difficulty, 
            points: task.points,
            createdAt: task.createdAt // Assurez-vous d'avoir createdAt si vous l'utilisez
        };
        return acc;
    }, {});
    
    // L'historique sera synchronisé sous forme de tableau (moins efficace mais simple)
    const dataToSync = {
        tasks: tasksData,
        stats: {
            currentStreak,
            maxStreak,
            totalPoints
        },
        archive: archive,
        streakHistory: streakHistory,
        pointsHistory: pointsHistory
    };

    try {
        await window.set(userRef, dataToSync);
    } catch (e) {
        console.error("Erreur de synchronisation :", e);
        alert("Erreur lors de la synchronisation initiale. Vérifiez votre connexion.");
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
        // On ne met pas d'alerte ici pour ne pas interrompre l'utilisateur à chaque point gagné.
    }
}


// --- 4. Logique de l'Application (Tâches, Série, Points) ---

/** Vérifie et gère la réinitialisation quotidienne. */
function checkDailyReset() {
    const now = new Date();
    const todayStr = now.toLocaleDateString('fr-FR');
    
    const lastCheckTime = lastCheckDate ? new Date(lastCheckDate.split('/').reverse().join('-')) : null;

    const isNewDay = !lastCheckTime || (now.setHours(RESET_HOUR, 0, 0, 0) > lastCheckTime.setHours(RESET_HOUR, 0, 0, 0));
    
    if (isNewDay) {
        // --- 1. Vérification et mise à jour de la Série ---
        const allCompleted = tasks.every(task => task.completed);
        const tasksToCompleteCount = tasks.filter(task => !task.completed).length;

        if (tasks.length > 0 && !allCompleted) {
            if (currentStreak > 0) {
                streakHistory.push({ date: lastCheckDate, streak: currentStreak });
                alert(`Dommage ! Votre série de ${currentStreak} jour(s) est brisée. ${tasksToCompleteCount} tâches non finies !`);
            }
            currentStreak = 0; 
        } else if (tasks.length > 0 && allCompleted) {
            currentStreak++;
        }

        // --- 2. Mise à jour du Record de Série (Max Streak) et Points ---
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
        
        // --- 3. Réinitialisation des tâches pour le nouveau jour ---
        tasks = tasks.map(task => ({ ...task, completed: false }));

        // --- 4. Mettre à jour la date de dernière vérification ---
        lastCheckDate = todayStr;
        
        // Sauvegarde conditionnelle
        if (appSettings.socialShareEnabled) {
             // Mettre à jour les stats et l'historique sur Firebase
             saveFirebaseState('stats', { currentStreak, maxStreak, totalPoints });
             saveFirebaseState('streakHistory', streakHistory);
             // Les tâches sont réinitialisées, on les sauve aussi
             syncLocalToFirebase(); 
        } else {
             saveLocalData();
        }
    }
}

/** Ajoute une nouvelle tâche. */
async function addTask() {
    const input = document.getElementById('new-task');
    const difficultySelect = document.getElementById('task-difficulty');
    const text = input.value.trim();
    const difficulty = difficultySelect.value;
    const points = POINTS_CONFIG[difficulty];

    if (text) {
        // Crée la tâche avec un ID unique localement pour le mode non-sync
        const taskId = Date.now().toString(); 
        
        const newTaskData = {
            id: taskId, // utilisé localement
            text: text,
            completed: false,
            difficulty: difficulty,
            points: points,
            createdAt: new Date().getTime()
        };

        if (appSettings.socialShareEnabled) {
            // Pousser vers Firebase (Firebase génère sa propre clé, mais on la garde dans l'objet pour la synchro)
            const tasksRef = window.ref(window.db, TASKS_PATH);
            try {
                // Utiliser push() pour que Firebase génère la clé (l'ID sera la clé RTDB)
                await window.push(tasksRef, { ...newTaskData, id: null }); // Retire l'ID temporaire car Firebase en crée un
                input.value = '';
            } catch (e) {
                console.error("Erreur Firebase:", e);
                alert("Erreur réseau: impossible d'ajouter la tâche au serveur.");
            }
        } else {
            // Mode local
            tasks.push(newTaskData);
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
        // On ne retire pas l'historique des points pour l'annulation
        triggerHaptics('error');
    }
    totalPoints += pointsChange;

    // 2. Mise à jour des données
    if (appSettings.socialShareEnabled) {
        const taskRef = window.ref(window.db, `${TASKS_PATH}/${taskId}`);
        try {
            // Mise à jour de la tâche et des stats globales
            await window.set(taskRef, { ...task, completed: newCompletedStatus }); 
            await saveFirebaseState('stats', { currentStreak, maxStreak, totalPoints });
            await saveFirebaseState('pointsHistory', pointsHistory);
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
}


/** Édite le texte d'une tâche. */
async function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newText = prompt(`Modifier la tâche "${task.text}" :`, task.text);
    if (newText && newText.trim() !== "") {
        if (appSettings.socialShareEnabled) {
            const taskRef = window.ref(window.db, `${TASKS_PATH}/${taskId}`);
            try {
                // Mise à jour seulement le champ 'text'
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
        const taskRef = window.ref(window.db, `${TASKS_PATH}/${taskId}`);
        const archiveRef = window.ref(window.db, ARCHIVE_PATH);

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

/** Charge les réglages dans le menu lors de l'initialisation. */
function loadSettingsUI() {
    document.getElementById('haptics-toggle').checked = appSettings.hapticsEnabled;
    document.getElementById('social-share-toggle').checked = appSettings.socialShareEnabled;
}

/** Bascule l'affichage du menu de réglages. */
function toggleSettingsMenu() {
    const menu = document.getElementById('settings-menu');
    menu.classList.toggle('hidden');
}


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

    // Assurez-vous que l'affichage utilise l'ID pour les actions, quel que soit l'origine (local ou Firebase)
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        li.innerHTML = `
            <div class="task-info">
                <span>${task.text}</span>
                <span class="task-difficulty">Difficulté: ${task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)} (+${task.points} pts)</span>
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

    // 3. Afficher l'historique de la série
    const streakListElement = document.getElementById('streak-history-list');
    streakListElement.innerHTML = '';
    const sortedStreakHistory = [...streakHistory].sort((a, b) => b.streak - a.streak);
    
    if (sortedStreakHistory.length === 0) {
        streakListElement.innerHTML = '<li>Pas encore de série terminée.</li>';
    }

    sortedStreakHistory.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `Série de ${item.streak} jours (terminée le ${item.date})`;
        streakListElement.appendChild(li);
    });
    
    // 4. Afficher la liste des archives
    const archiveListElement = document.getElementById('archive-list');
    archiveListElement.innerHTML = '';
    if (archive.length === 0) {
        archiveListElement.innerHTML = '<li>L\'archive est vide.</li>';
    }
    archive.slice(-5).reverse().forEach(item => { 
        const li = document.createElement('li');
        li.textContent = `${item.archivedDate}: "${item.text}" - ${item.completed ? '✅ Fait' : '❌ Non fait'}`;
        archiveListElement.appendChild(li);
    });
    
    // 5. Afficher l'historique des points
    displayHistory('daily'); 
}

/** Filtre et affiche l'historique des points selon la période. */
function displayHistory(period) {
    const listElement = document.getElementById('points-history-list');
    listElement.innerHTML = '';
    document.getElementById('history-period-title').textContent = 
        period.charAt(0).toUpperCase() + period.slice(1);

    let filteredHistory = [];
    const now = new Date();

    pointsHistory.forEach(item => {
        const parts = item.date.split('/');
        const itemDate = new Date(parts[2], parts[1] - 1, parts[0]);
        let isIncluded = false;

        switch (period) {
            case 'daily':
                isIncluded = itemDate.toLocaleDateString('fr-FR') === now.toLocaleDateString('fr-FR');
                break;
            case 'weekly':
                const oneWeekAgo = new Date(now);
                oneWeekAgo.setDate(now.getDate() - 7);
                isIncluded = itemDate >= oneWeekAgo;
                break;
            case 'monthly':
                isIncluded = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                break;
            case 'yearly':
                isIncluded = itemDate.getFullYear() === now.getFullYear();
                break;
        }

        if (isIncluded) {
            filteredHistory.push(item);
        }
    });

    if (filteredHistory.length === 0) {
        listElement.innerHTML = `<li>Aucun point gagné cette ${period === 'daily' ? 'journée' : period === 'weekly' ? 'semaine' : period === 'monthly' ? 'mois' : 'année'}.</li>`;
    }

    filteredHistory.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.date} : +${item.points} points (${item.reason})`;
        listElement.appendChild(li);
    });
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

/** Déclenche un retour haptique (vibration) via le pont Median.co. */
function triggerHaptics(type = 'success') {
    if (!appSettings.hapticsEnabled) return; 

    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gonative) {
        let feedbackType = 'impactLight'; 
        if (type === 'success') feedbackType = 'success';
        if (type === 'error') feedbackType = 'error';

        window.webkit.messageHandlers.gonative.postMessage({
            command: 'hapticEngine',
            arguments: {
                feedback: feedbackType
            }
        });
    }
}

/** [Fonctions de notification inchangées...] */
function showObjectiveNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("✨ Objectif Quotidien", {
            body: "Il est temps de mettre à jour et de planifier vos objectifs pour la journée !",
            icon: 'icon.png' 
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}

function checkNotificationTime() {
    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour === NOTIFICATION_HOUR) {
        const lastNotifStr = localStorage.getItem('lastNotificationDate');
        const todayStr = now.toLocaleDateString('fr-FR');
        
        if (lastNotifStr !== todayStr) {
            showObjectiveNotification();
            localStorage.setItem('lastNotificationDate', todayStr);
        }
    }
}


// --- 7. Exécution au Chargement ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Charger les données (settings et data)
    loadData(); 
    
    // 2. Vérification quotidienne après le chargement des données
    checkDailyReset(); 

    // 3. Demander la permission de notification
    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    // 4. Mettre en place la vérification de notification
    setInterval(checkNotificationTime, 60 * 60 * 1000);
    checkNotificationTime();
});
