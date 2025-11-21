// --- 1. Variables Globales et Initialisation ---

// Clés de stockage local
const STORAGE_KEYS = {
    TASKS: 'todoApp.tasks',
    STREAK: 'todoApp.currentStreak',
    TOTAL_POINTS: 'todoApp.totalPoints',
    STREAK_HISTORY: 'todoApp.streakHistory',
    POINTS_HISTORY: 'todoApp.pointsHistory',
    LAST_CHECK: 'todoApp.lastCheckDate', // Pour la réinitialisation journalière
};

let tasks = [];
let currentStreak = 0;
let totalPoints = 0;
let streakHistory = [];
let pointsHistory = [];
let lastCheckDate = null;

// Points attribués pour chaque nouvelle série
const POINTS_PER_NEW_STREAK_RECORD = 10;
// Heure de la notification/réinitialisation (0h00 heure de Paris)
const RESET_HOUR = 0; 
const NOTIFICATION_HOUR = 10; // 10h00 pour la notification

// --- 2. Fonctions de Stockage Local ---

/** Charge les données depuis localStorage. */
function loadData() {
    tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    currentStreak = parseInt(localStorage.getItem(STORAGE_KEYS.STREAK) || '0');
    totalPoints = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_POINTS) || '0');
    streakHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.STREAK_HISTORY) || '[]');
    pointsHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.POINTS_HISTORY) || '[]');
    lastCheckDate = localStorage.getItem(STORAGE_KEYS.LAST_CHECK);
}

/** Sauvegarde les données dans localStorage. */
function saveData() {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.STREAK, currentStreak.toString());
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
    const todayStr = now.toLocaleDateString('fr-FR'); // Format JJ/MM/AAAA

    if (lastCheckDate === todayStr) {
        // Déjà vérifié aujourd'hui, rien à faire (sauf si c'est après 0h00)
        return;
    }

    // Récupérer la date de la dernière vérification pour la comparaison
    const lastCheckTime = lastCheckDate ? new Date(lastCheckDate) : null;
    
    // Si nous sommes sur un nouveau jour (ou que c'est la première utilisation)
    // Nous devons vérifier si toutes les tâches d'hier ont été complétées.

    // 1. Déterminer si un jour s'est écoulé
    const isNewDay = !lastCheckTime || (now.setHours(RESET_HOUR, 0, 0, 0) > lastCheckTime.setHours(RESET_HOUR, 0, 0, 0));
    
    if (isNewDay) {
        // Vérifier si toutes les tâches précédentes étaient complétées
        const allCompleted = tasks.every(task => task.completed);
        const hasTasks = tasks.length > 0;

        if (hasTasks && !allCompleted) {
            // La série est brisée !
            if (currentStreak > 0) {
                // Enregistrer la série brisée
                streakHistory.push({ date: lastCheckTime.toLocaleDateString('fr-FR'), streak: currentStreak });
                // Afficher une alerte (sera mieux gérée par Median.co/notifications)
                alert(`Dommage ! Votre série de ${currentStreak} jour(s) est brisée. Réessayez !`);
            }
            currentStreak = 0; // Réinitialiser la série
        } else if (hasTasks && allCompleted) {
            // Victoire ! Augmenter la série.
            currentStreak++;
        }

        // 2. Gérer les points pour un nouveau record de série
        const maxStreak = Math.max(...streakHistory.map(h => h.streak), 0);
        if (currentStreak > maxStreak) {
            totalPoints += POINTS_PER_NEW_STREAK_RECORD;
            
            // Enregistrer l'historique des points
            pointsHistory.push({ 
                date: todayStr, 
                points: POINTS_PER_NEW_STREAK_RECORD, 
                reason: `Nouveau record de série: ${currentStreak} jours` 
            });
            
            // Notification de gain de points (sera mieux gérée par Median.co)
            alert(`Félicitations ! Nouveau record de série : ${currentStreak} jours ! Vous gagnez ${POINTS_PER_NEW_STREAK_RECORD} points !`);
        }
        
        // 3. Réinitialiser les tâches pour le nouveau jour
        // Conserver les tâches mais les marquer comme non complétées
        tasks = tasks.map(task => ({ ...task, completed: false }));

        // 4. Mettre à jour la date de dernière vérification
        lastCheckDate = todayStr;
        saveData();
    }
}


/** Ajoute une nouvelle tâche à la liste. */
function addTask() {
    const input = document.getElementById('new-task');
    const text = input.value.trim();

    if (text) {
        tasks.push({
            id: Date.now(),
            text: text,
            completed: false
        });
        input.value = '';
        saveData();
    }
}

/** Bascule l'état de complétion d'une tâche et met à jour la série/points. */
function toggleTaskCompletion(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveData();
    }
}

/** Supprime une tâche. */
function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveData();
}

// --- 4. Mise à Jour de l'Interface Utilisateur (UI) ---

/** Met à jour tous les éléments d'affichage. */
function updateUI() {
    // 1. Mettre à jour les statistiques
    document.getElementById('current-streak').textContent = currentStreak;
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
            <span>${task.text}</span>
            <div class="task-actions">
                <button class="complete-btn" onclick="toggleTaskCompletion(${task.id})">
                    ${task.completed ? 'Annuler' : 'Fait ✅'}
                </button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">Supprimer 🗑️</button>
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

    // Afficher l'historique des points pour la période par défaut (daily)
    displayHistory('daily'); 
}

/** Filtre et affiche l'historique des points selon la période. */
function displayHistory(period) {
    const listElement = document.getElementById('points-history-list');
    listElement.innerHTML = '';
    document.getElementById('history-period-title').textContent = 
        period.charAt(0).toUpperCase() + period.slice(1); // Met la première lettre en majuscule

    let filteredHistory = [];
    const now = new Date();

    pointsHistory.forEach(item => {
        const itemDate = new Date(item.date.split('/').reverse().join('-')); // Convertir 'JJ/MM/AAAA' en Date
        let isIncluded = false;

        switch (period) {
            case 'daily':
                isIncluded = itemDate.toLocaleDateString('fr-FR') === now.toLocaleDateString('fr-FR');
                break;
            case 'weekly':
                // Simple : 7 jours avant aujourd'hui
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

// --- 5. Logique des Notifications (Dépendant de l'environnement) ---

/** Demande la permission de notification au navigateur. */
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

/** Tente d'afficher une notification d'objectif. */
function showObjectiveNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("✨ Objectif Quotidien", {
            body: "Il est temps de mettre à jour et de planifier vos objectifs pour la journée !",
            icon: 'icon.png' // Ajoutez un fichier icon.png dans le dossier de l'appli
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        // Demande de permission si elle n'a pas été refusée
        requestNotificationPermission();
    }
}

/** Vérifie si c'est l'heure de la notification. */
function checkNotificationTime() {
    const now = new Date();
    // Décalage pour l'heure de Paris/France (CET/CEST) - Nécessite une gestion plus robuste
    // Pour un environnement natif (Median.co), utilisez la librairie de notification native.
    // Ici, on utilise l'heure locale, en espérant qu'elle corresponde.
    const currentHour = now.getHours();

    if (currentHour === NOTIFICATION_HOUR) {
        // Pour éviter de spammer, on ne notifie qu'une fois par jour
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
    checkDailyReset(); // Important : vérifier la série dès le chargement
    updateUI();
    requestNotificationPermission(); // Demande la permission
    
    // Vérifie l'heure de la notification toutes les heures (ou plus souvent)
    setInterval(checkNotificationTime, 60 * 60 * 1000); // Toutes les heures
    checkNotificationTime(); // Première vérification immédiate
});
