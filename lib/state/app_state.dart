// lib/state/app_state.dart
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart'; // Nécessite l'ajout de 'uuid' dans pubspec.yaml
import 'dart:math';

// Importe vos modèles de données
import '../models/task.dart';
import '../models/profile.dart';

// Constante pour l'ID unique
const uuid = Uuid();

// AppState est la source unique de vérité de votre application.
class AppState extends ChangeNotifier {
  // --- Propriétés de l'état (données de l'application) ---
  // Note: Nous utilisons copyWith dans Profile, assurez-vous de l'ajouter (voir section 4)
  Profile _profile = Profile(icon: '👤', totalPoints: 0, currentStreak: 0, maxStreak: 0);
  List<Task> _tasks = [];

  // --- Getters (Accesseurs en lecture seule) ---
  Profile get profile => _profile;
  List<Task> get tasks => List.unmodifiable(_tasks); 

  // Initialisation
  AppState() {
    _loadInitialData();
  }

  void _loadInitialData() {
    // Liste de démo
    _tasks = [
      Task(
        id: uuid.v4(),
        text: 'Mettre à jour pubspec.yaml',
        completed: false,
        difficulty: 'easy',
        points: 1,
      ),
      Task(
        id: uuid.v4(),
        text: 'Intégrer AppState dans TasksScreen',
        completed: false,
        difficulty: 'medium',
        points: 3,
      ),
    ];
    // Notifie les widgets après le chargement initial
    notifyListeners(); 
  }

  // --- Méthodes de la LOGIQUE (l'équivalent des fonctions de app.js) ---

  // 1. Ajouter une tâche
  void addTask(String text, String difficulty, [bool isRecurring = false]) {
    int points;
    switch (difficulty) {
      case 'easy':
        points = 1;
        break;
      case 'hard':
        points = 5;
        break;
      case 'medium':
      default:
        points = 3;
        break;
    }

    final newTask = Task(
      id: uuid.v4(),
      text: text,
      completed: false,
      difficulty: difficulty,
      points: points,
      isRecurring: isRecurring,
    );

    _tasks.add(newTask);
    notifyListeners();
  }

  // 2. Compléter une tâche (avec logique de gamification)
  void completeTask(String taskId) {
    final taskIndex = _tasks.indexWhere((task) => task.id == taskId);

    if (taskIndex != -1 && !_tasks[taskIndex].completed) {
      final completedTask = _tasks[taskIndex].copyWith(completed: true);
      _tasks[taskIndex] = completedTask;

      // Ajouter des points et mettre à jour la série
      _profile = _profile.copyWith(
        totalPoints: _profile.totalPoints + completedTask.points,
      );

      _profile = _profile.copyWith(
        currentStreak: _profile.currentStreak + 1,
      );
      if (_profile.currentStreak > _profile.maxStreak) {
         _profile = _profile.copyWith(maxStreak: _profile.currentStreak);
      }

      notifyListeners();
    }
  }

  // 3. Supprimer une tâche
  void deleteTask(String taskId) {
    _tasks.removeWhere((task) => task.id == taskId);
    notifyListeners();
  }
  
  // 4. Acheter un article de la boutique (logique simple)
  bool buyItem(int cost) {
    if (_profile.totalPoints >= cost) {
      _profile = _profile.copyWith(totalPoints: _profile.totalPoints - cost);
      notifyListeners();
      return true;
    }
    return false;
  }
}
