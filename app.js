// --- 1. Variables Globales et Configuration ---

const STORAGE_KEYS = {
    TASKS: 'todoApp.tasks',
    ARCHIVE: 'todoApp.archive', // Nouvelle clé pour l'archive
    STREAK: 'todoApp.currentStreak',
    MAX_STREAK: 'todoApp.maxStreak', // Nouvelle clé pour le record
    TOTAL_POINTS: 'todoApp.totalPoints',
    STREAK_HISTORY: 'todoApp.streakHistory',
    POINTS_HISTORY: 'todoApp.pointsHistory',
    LAST_CHECK: 'todoApp.lastCheckDate',
};

const POINTS_CONFIG = {
    easy: 1,
    medium: 3,
    hard: 5,
    newStreakRecord: 10 // Points pour un nouveau record de série
};

const RESET_HOUR = 0; // Réinitialisation à 0h00
const NOTIFICATION_HOUR = 10; // Notification à 10h00

let tasks = [];
let archive = [];
let currentStreak = 0;
let maxStreak = 0; // Initialisation du record
let totalPoints = 0;
let streakHistory = [];
let pointsHistory = [];
let lastCheckDate = null;

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

// --- 3. Logique de l'Application (Tâches, Série, Points) ---

/** Vérifie et gère la réinitialisation quotidienne à 0h00 (heure de Paris). */
function checkDailyReset() {
    const now = new Date();
    const todayStr = now.toLocaleDateString('fr-FR');
    
    // Convertir la date stockée en objet Date pour la comparaison
    const lastCheckTime = lastCheckDate ? new Date(lastCheckDate.split('/').reverse().join('-')) : null;

    // Déterminer si nous sommes sur un nouveau jour par rapport à la dernière vérification
    const isNewDay = !lastCheckTime || (now.setHours(RESET_HOUR, 0, 0, 0) > lastCheckTime.setHours(RESET_HOUR, 0, 0, 0));
    
    if (isNewDay) {
        // --- 1. Vérification et mise à jour de la Série ---
        const allCompleted = tasks.every(task => task.completed);
        const tasksToCompleteCount = tasks.filter(task => !task.completed).length;

        if (tasks.length > 0 && !allCompleted) {
            // La série est brisée si des tâches existaient et n'étaient pas finies
            if (currentStreak > 0) {
                streakHistory.push({ date: lastCheckDate, streak: currentStreak });
                alert(`Dommage ! Votre série de ${currentStreak} jour(s) est brisée. ${tasksToCompleteCount} tâches non finies !`);
            }
            currentStreak = 0; 
        } else if (tasks.length > 0 && allCompleted) {
            // Victoire si toutes les tâches sont complétées
            currentStreak++;
        }
        // Si aucune tâche, la série reste inchangée (ni brisée, ni augmentée)

        // --- 2. Mise à jour du Record de Série (Max Streak) et Points ---
        if (currentStreak > maxStreak) {
            maxStreak = currentStreak; // Nouveau record
            totalPoints += POINTS_CONFIG.newStreakRecord;
            
            // Enregistrement de l'historique des points
            pointsHistory.push({ 
                date: todayStr, 
                points: POINTS_CONFIG.newStreakRecord, 
                reason: `Nouveau record de série : ${currentStreak} jours` 
            });
            
            alert(`Félicitations ! Nouveau record de série : ${currentStreak} jours ! Vous gagnez ${POINTS_CONFIG.newStreakRecord} points !`);
        }
        
        // --- 3. Réinitialisation des tâches pour le nouveau jour ---
        // Conserver les tâches mais les marquer comme non complétées
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
            // Tâche complétée: Ajouter les points
            totalPoints += task.points;
            pointsHistory.push({ 
                date: new Date().toLocaleDateString('fr-FR'), 
                points: task.points, 
                reason: `Tâche complétée: "${task.text}"` 
            });
            triggerHaptics('success');
        } else {
            // Tâche annulée: Retirer les points (optionnel, mais juste)
            totalPoints -= task.points;
            triggerHaptics('error');
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

/** Archive une tâche (remplace la suppression simple). */
function archiveTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        const [taskToArchive] = tasks.splice(taskIndex, 1);
        
        // Ajouter la tâche à l'archive
        archive.push({
            ...taskToArchive,
            archivedDate: new Date().toLocaleDateString('fr-FR')
        });
        
        saveData();
    }
}

// --- 4. Mise à Jour de l'Interface Utilisateur (UI) ---

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
                <button class="delete-btn" onclick="archiveTask(${task.id})">Archiver 📦</button>
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
    archive.slice(-5).reverse().forEach(item => { // Afficher les 5 dernières archivées
        const li = document.createElement('li');
        li.textContent = `${item.archivedDate}: "${item.text}"`;
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
        // Convertir 'JJ/MM/AAAA' en Date
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

// --- 5. Logique des Notifications et Haptics ---

/** Déclenche un retour haptique (vibration) via le pont Median.co. */
function triggerHaptics(type = 'success') {
    // Cette fonction NE fonctionnera QUE lorsque l'application est compilée avec Median.co
    // et que le "JavaScript Bridge" est actif.
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gonative) {
        // 'success' (tâche faite), 'error' (tâche annulée/série brisée), 'impactLight' (simple clic)
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
    // Note: Pour Android, le pont est souvent un peu différent, mais Median.co peut le gérer.
}


/** Demande la permission de notification et planifie l'affichage (seulement si l'appli est ouverte). */
function showObjectiveNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("✨ Objectif Quotidien", {
            body: "Il est temps de mettre à jour et de planifier vos objectifs pour la journée !",
            icon: 'icon.png' 
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    // IMPORTANT: Pour une application native (APK), configurez la notification récurrente
    // DIRECTEMENT dans l'App Studio de Median.co à l'heure souhaitée (10h00 France) pour qu'elle
    // s'affiche même lorsque l'application est fermée.
}

/** Vérifie si c'est l'heure de la notification. */
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

// --- 6. Exécution au Chargement ---

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    checkDailyReset(); 
    updateUI();
    
    // Tentative de demande de permission de notification au démarrage
    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    // Vérification de l'heure de la notification toutes les heures
    setInterval(checkNotificationTime, 60 * 60 * 1000);
    checkNotificationTime(); // Première vérification immédiate
});
