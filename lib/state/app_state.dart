// lib/state/app_state.dart
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'dart:math';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/task.dart';
import '../models/profile.dart';

const uuid = Uuid();

class AppState extends ChangeNotifier {
  // --- Locale management with persistence ---
  Locale? _locale;
  Locale? get locale => _locale;

  Future<void> setLocale(Locale? locale) async {
    _locale = locale;
    try {
      final prefs = await SharedPreferences.getInstance();
      if (locale == null) {
        await prefs.remove('locale');
      } else {
        await prefs.setString('locale', locale.languageCode);
      }
    } catch (_) {
      // ignore persistence errors
    }
    notifyListeners();
  }

  Future<void> clearLocale() async {
    _locale = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('locale');
    } catch (_) {}
    notifyListeners();
  }

  // --- App data ---
  Profile _profile = Profile(icon: '👤', totalPoints: 0, currentStreak: 0, maxStreak: 0);
  List<Task> _tasks = [];

  Profile get profile => _profile;
  List<Task> get tasks => List.unmodifiable(_tasks);

  AppState() {
    _loadInitialData();
    _loadLocaleFromPrefs();
  }

  Future<void> _loadLocaleFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final lang = prefs.getString('locale');
      if (lang != null && lang.isNotEmpty) {
        _locale = Locale(lang);
        notifyListeners();
      }
    } catch (_) {
      // ignore
    }
  }

  void _loadInitialData() {
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
    notifyListeners();
  }

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

  void completeTask(String taskId) {
    final taskIndex = _tasks.indexWhere((task) => task.id == taskId);

    if (taskIndex != -1 && !_tasks[taskIndex].completed) {
      final completedTask = _tasks[taskIndex].copyWith(completed: true);
      _tasks[taskIndex] = completedTask;

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

  void deleteTask(String taskId) {
    _tasks.removeWhere((task) => task.id == taskId);
    notifyListeners();
  }

  bool buyItem(int cost) {
    if (_profile.totalPoints >= cost) {
      _profile = _profile.copyWith(totalPoints: _profile.totalPoints - cost);
      notifyListeners();
      return true;
    }
    return false;
  }
}
