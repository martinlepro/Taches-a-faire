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
    SETTINGS: 'todoApp.settings' // Nouvelle clé pour les réglages
};

const POINTS_CONFIG = {
    easy: 1,
    medium: 3,
    hard: 5,
    newStreakRecord: 10
};

const RESET_HOUR = 0; 
const NOTIFICATION_HOUR = 10; 

let tasks = [];
let archive = [];
let currentStreak = 0;
let maxStreak = 0;
let totalPoints = 0;
let streakHistory = [];
let pointsHistory = [];
let lastCheckDate = null;

// Nouveaux réglages par défaut
let appSettings = {
    hapticsEnabled: true,
    socialShareEnabled: false
};

// --- 2. Fonctions de Stockage Local ---

/** Charge les données depuis localStorage. */
function loadData() {
    tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    archive = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARCHIVE) || '[]');
    currentStreak = parseInt(localStorage.getItem(STORAGE_KEYS.STREAK) || '0');
    maxStreak = parseInt(localStorage.getItem(STORAGE_KEYS.MAX_STREAK) || '0');
    totalPoints = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_POINTS) || '0');
    streakHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.STREAK_HISTORY) || '[]');
    pointsHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.POINTS_HISTORY) || '[]');
    lastCheckDate = localStorage.getItem(STORAGE_KEYS.LAST_CHECK);
    
    // Charger les réglages
    const loadedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
    appSettings = { ...appSettings, ...loadedSettings };
}

/** Sauvegarde les données dans localStorage. */
function saveData() {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.ARCHIVE, JSON.stringify(archive));
    localStorage.setItem(STORAGE_KEYS.STREAK, currentStreak.toString());
    localStorage.setItem(STORAGE_KEYS.MAX_STREAK, maxStreak.toString());
    localStorage.setItem(STORAGE_KEYS.TOTAL_POINTS, totalPoints.toString());
    localStorage.setItem(STORAGE_KEYS.STREAK_HISTORY, JSON.stringify(streakHistory));
    localStorage.setItem(STORAGE_KEYS.POINTS_HISTORY, JSON.stringify(pointsHistory));
    localStorage.setItem(STORAGE_KEYS.LAST_CHECK, lastCheckDate);
    
    updateUI();
}

// --- 3. Gestion des Réglages (Nouveau) ---

/** Sauvegarde l'état des réglages dans localStorage. */
function saveSettings() {
    appSettings.hapticsEnabled = document.getElementById('haptics-toggle').checked;
    appSettings.socialShareEnabled = document.getElementById('social-share-toggle').checked;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
    alert('Réglages sauvegardés !');
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

// --- 4. Logique de l'Application (Tâches, Série, Points) ---

/** Vérifie et gère la réinitialisation quotidienne à 0h00 (heure de Paris). */
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
        saveData();
    }
}


/** Ajoute une nouvelle tâche à la liste. */
function addTask() {
    const input = document.getElementById('new-task');
    const difficultySelect = document.getElementById('task-difficulty');
    const text = input.value.trim();
    const difficulty = difficultySelect.value;
    const points = POINTS_CONFIG[difficulty];

    if (text) {
        tasks.push({
            id: Date.now(),
            text: text,
            completed: false,
            difficulty: difficulty,
            points: points
        });
        input.value = '';
        saveData();
    }
}

/** Bascule l'état de complétion d'une tâche et attribue les points. */
function toggleTaskCompletion(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const wasCompleted = task.completed;
        task.completed = !wasCompleted;

        if (!wasCompleted) {
            totalPoints += task.points;
            pointsHistory.push({ 
                date: new Date().toLocaleDateString('fr-FR'), 
                points: task.points, 
                reason: `Tâche complétée: "${task.text}"` 
            });
            // Haptics activés si le réglage est ON
            if (appSettings.hapticsEnabled) {
                 triggerHaptics('success');
            }
        } else {
            totalPoints -= task.points;
            if (appSettings.hapticsEnabled) {
                 triggerHaptics('error');
            }
        }
        saveData();
    }
}

/** Édite le texte d'une tâche. */
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const newText = prompt(`Modifier la tâche "${task.text}" :`, task.text);
        if (newText && newText.trim() !== "") {
            task.text = newText.trim();
            saveData();
        }
    }
}

/** Archive une tâche. */
function archiveTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        const [taskToArchive] = tasks.splice(taskIndex, 1);
        
        archive.push({
            ...taskToArchive,
            archivedDate: new Date().toLocaleDateString('fr-FR')
        });
        
        saveData();
    }
}

// --- 5. Partage Social (Simulé) (Nouveau) ---

/** Génère un lien de partage des stats locales (Simulation). */
function shareLocalStats() {
    // Collecter les stats essentielles
    const stats = {
        currentStreak: currentStreak,
        maxStreak: maxStreak,
        totalPoints: totalPoints,
        lastUpdate: new Date().toLocaleString('fr-FR')
    };

    const statsJSON = JSON.stringify(stats);
    // Encoder les données pour les mettre dans l'URL (simulé)
    const encodedStats = btoa(statsJSON); 

    // Créer un lien fictif
    const shareLink = `Mon Appli://stats?data=${encodedStats}`; 

    // Utiliser l'API de partage native du mobile
    if (navigator.share) {
        navigator.share({
            title: 'Mes Stats de Gamification !',
            text: `Je suis à ${currentStreak} jours de série et ${totalPoints} points ! Vois mes stats :`,
            url: shareLink
        }).then(() => console.log('Partage réussi'))
          .catch((error) => console.log('Erreur de partage', error));
    } else {
        // Fallback pour les navigateurs non compatibles (ou si l'app n'est pas native)
        prompt("Copiez ce lien pour partager vos stats (simulé) :", shareLink);
    }
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

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        li.innerHTML = `
            <div class="task-info">
                <span>${task.text}</span>
                <span class="task-difficulty">Difficulté: ${task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)} (+${task.points} pts)</span>
            </div>
            <div class="task-actions">
                <button class="complete-btn" onclick="toggleTaskCompletion(${task.id})">
                    ${task.completed ? 'Annuler' : 'Fait ✅'}
                </button>
                <button class="edit-btn" onclick="editTask(${task.id})">Modifier ✏️</button>
                
                ${task.completed ? 
                    `<button class="delete-btn" onclick="archiveTask(${task.id})">Archiver 📦</button>` 
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

    // 5. Afficher l'historique des points pour la période par défaut (daily)
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

// --- 7. Logique des Notifications et Haptics ---

/** Déclenche un retour haptique (vibration) via le pont Median.co. */
function triggerHaptics(type = 'success') {
    // Vérifie si les Haptics sont activés dans les réglages
    if (!appSettings.hapticsEnabled) return; 

    // Utilisation du pont Median.co
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

// --- 8. Exécution au Chargement ---

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    checkDailyReset(); 
    loadSettingsUI(); // Charger les réglages dans le menu
    updateUI();
    
    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    setInterval(checkNotificationTime, 60 * 60 * 1000);
    checkNotificationTime();
});
