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
    // NOUVELLES CLÉS
    SHOP_ITEMS: 'todoApp.shopItems',
    PROFILE: 'todoApp.profile'
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
    notificationLeadTimeMinutes: 30 
};

// NOUVEAU: État de la boutique et du profil
let shopItems = [];
let profile = {
    icon: '👤', // Icône de profil par défaut
    // Le niveau est calculé dynamiquement
};

// NOUVEAU: État des filtres et du tri
let currentSort = 'default'; // 'difficulty', 'time'
let currentFilter = 'all'; // 'all', 'todo'


// --- 2. Fonctions de Stockage (Local / Firebase) ---

/** Initialise la boutique avec les articles par défaut. */
function initializeShop() {
    const defaultItems = [
        { id: 1, name: "Icône 'Rocket'", cost: 100, type: 'icon', value: '🚀', owned: false },
        { id: 2, name: "Icône 'Star'", cost: 250, type: 'icon', value: '⭐', owned: false },
        { id: 3, name: "Icône 'Ninja'", cost: 500, type: 'icon', value: '🥷', owned: false },
        // Ajout d'une récompense non cosmétique (exemple)
        { id: 4, name: "Reset de Série", cost: 1000, type: 'utility', value: 'reset_streak', owned: false, description: "Réinitialise votre série sans pénalité." }
    ];
    shopItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_ITEMS) || JSON.stringify(defaultItems));
}

/** Charge toutes les données depuis localStorage ou Firebase. */
function loadData() {
    loadLocalData(); 
    initializeShop(); // Charger la boutique
    
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
    
    // NOUVEAU: Chargement du profil
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
    
    // NOUVEAU: Sauvegarde de la boutique et du profil
    localStorage.setItem(STORAGE_KEYS.SHOP_ITEMS, JSON.stringify(shopItems));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

// ... (Les fonctions Firebase restent inchangées dans la logique) ...

/** Initialise l'écouteur pour Firebase RTDB. */
function setupFirebaseListener() {
    // ... (Logique Firebase inchangée, elle synchroniserait seulement les données de base) ...
    // Note: La boutique et le profil devraient rester locaux ou utiliser un chemin Firebase dédié.
    // Pour cet exemple, on suppose qu'ils restent en localStorage même si Firebase est actif.
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


// --- 3. Logique de Gamification et Tâches ---

// NOUVELLE FONCTION: Calcule le niveau de l'utilisateur
function calculateLevel() {
    // Progression simple : Niveau = plancher(racine_carrée(Points / 100))
    // Ex: 0-99pts = Niv 0, 100-399pts = Niv 1, 400-899pts = Niv 2, etc.
    return Math.floor(Math.sqrt(totalPoints / 100));
}

// ... (checkRecurrenceAndDailyReset reste inchangée) ...

// ... (addTask, toggleTaskCompletion, archiveTask, restoreTask restent inchangées) ...


// --- 4. Logique de la Boutique et du Profil ---

// NOUVELLE FONCTION: Acheter un article
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
             alert(`${item.name} déjà possédé !`);
        }
        return;
    }

    if (totalPoints >= item.cost) {
        totalPoints -= item.cost;
        item.owned = true;
        
        // Logique d'application immédiate (pour les icônes)
        if (item.type === 'icon') {
            profile.icon = item.value; 
        } else if (item.type === 'utility' && item.value === 'reset_streak') {
            // Logique de l'utilitaire
            alert("Utilitaire acheté. (L'effet devrait être appliqué ici)."); 
        }
        
        saveLocalData();
        updateUI();
        triggerHaptics('success');
        alert(`Achat réussi : ${item.name} ! ${item.cost} points dépensés.`);
    } else {
        alert(`Points insuffisants ! Il vous manque ${item.cost - totalPoints} points. Vous avez ${totalPoints}.`);
    }
}

// NOUVELLE FONCTION: Partager le profil
function shareProfile() {
    const currentLevel = calculateLevel();
    const profileText = `Mon Profil de Gestion de Tâches :\nNiveau ${currentLevel} (${totalPoints} points)\nSérie Max : ${maxStreak} jours\nIcône Actuelle : ${profile.icon}`;
    
    // Utilisation de l'API Web Share pour le partage natif (Median le gère souvent)
    if (navigator.share) {
        navigator.share({
            title: 'Mon Profil de Tâches Gamifié',
            text: profileText
        }).then(() => console.log('Partage de profil réussi'))
          .catch((error) => console.log('Erreur de partage', error));
    } else {
        // Fallback pour les navigateurs ne supportant pas l'API
        prompt("Copiez ce texte pour partager votre profil :", profileText);
    }
}


// --- 5. Sauvegarde/Restauration Manuelle ---

// NOUVELLE FONCTION: Exporter les données
function exportData() {
    const data = {
        tasks,
        archive,
        currentStreak,
        maxStreak,
        totalPoints,
        streakHistory,
        pointsHistory,
        appSettings,
        shopItems,
        profile
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

// NOUVELLE FONCTION: Importer les données
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Mise à jour de toutes les variables globales
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
            window.location.reload(); // Recharger pour appliquer les changements
        } catch (error) {
            alert('Erreur: Le fichier n\'est pas un JSON valide ou est corrompu.');
            console.error(error);
        }
    };
    reader.readAsText(file);
}


// --- 6. Gestion des Filtres et du Tri ---

// NOUVELLE FONCTION: Définir le filtre (all ou todo)
function setTaskFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.tasks-controls button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter-${filter}`).classList.add('active');
    updateUI();
}

// NOUVELLE FONCTION: Définir le tri
function setTaskSort(sort) {
    currentSort = sort;
    updateUI();
}

// NOUVELLE FONCTION: Basculer l'affichage des sections
function toggleSection(sectionId) {
    document.querySelectorAll('section').forEach(sec => {
        if (sec.id && sec.id.endsWith('-section') && sec.id !== sectionId) {
            sec.classList.add('hidden');
        }
    });
    const section = document.getElementById(sectionId);
    section.classList.toggle('hidden');
}

// ... (triggerHaptics, scheduleTaskNotification restent inchangées) ...


// --- 7. Mise à Jour de l'Interface Utilisateur (UI) ---

/** Met à jour tous les éléments d'affichage. */
function updateUI() {
    // 1. Mise à jour des statistiques et du niveau
    const currentLevel = calculateLevel();
    document.getElementById('current-streak').textContent = currentStreak;
    document.getElementById('max-streak').textContent = maxStreak;
    document.getElementById('total-points').textContent = totalPoints;
    
    // NOUVEAU: Affichage du niveau et icône du profil
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
        // Trie par points décroissants (Hard > Medium > Easy)
        displayTasks.sort((a, b) => POINTS_CONFIG[b.difficulty] - POINTS_CONFIG[a.difficulty]);
    } else if (currentSort === 'time') {
        // Trie par dueTime croissant
        displayTasks.sort((a, b) => {
            if (!a.dueTime && !b.dueTime) return 0;
            if (!a.dueTime) return 1; 
            if (!b.dueTime) return -1;
            return a.dueTime.localeCompare(b.dueTime);
        });
    }


    // 3. Afficher la liste des tâches (en utilisant displayTasks)
    const taskListElement = document.getElementById('tasks-list');
    taskListElement.innerHTML = '';
    
    if (displayTasks.length === 0) {
        taskListElement.innerHTML = `<li>${currentFilter === 'todo' ? '🎉 Tout est fait !' : 'Aucune tâche à afficher.'}</li>`;
    }

    displayTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        
        // ... (La construction du LI reste la même, utilisant task)
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

    // 4. Afficher la liste des archives (Archive section should be toggled by a button now)
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
    
    
    // 5. NOUVEAU: Afficher la boutique
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

// ... (Autres fonctions comme editTask, toggleSettingsMenu restent inchangées) ...

// --- 8. Exécution au Chargement ---

document.addEventListener('DOMContentLoaded', () => {
    loadData(); 
    checkRecurrenceAndDailyReset(); 

    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    // Initialiser le filtre "all" comme actif
    document.getElementById('filter-all').classList.add('active');
});
