// lib/state/app_state.dart
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'dart:math';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/task.dart';
import '../models/profile.dart';
import '../notifications/notification_helper.dart';

const uuid = Uuid();

class AppState extends ChangeNotifier {
  // Locale persisted
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
    } catch (_) {}
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

  Profile _profile = Profile(icon: '👤', totalPoints: 0, currentStreak: 0, maxStreak: 0);
  List<Task> _tasks = [];

  Profile get profile => _profile;
  List<Task> get tasks => List.unmodifiable(_tasks);

  // Reminder hour (default 19)
  int _reminderHour = 19;
  int get reminderHour => _reminderHour;

  AppState() {
    _loadInitialData();
    _loadFromPrefs();
  }

  // Persistence: tasks, locale, reminder hour
  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final tasksRaw = prefs.getString('tasks');
      if (tasksRaw != null && tasksRaw.isNotEmpty) {
        final List<dynamic> list = jsonDecode(tasksRaw);
        _tasks = list.map((e) => Task.fromJson(Map<String, dynamic>.from(e))).toList();
      }
      final lang = prefs.getString('locale');
      if (lang != null && lang.isNotEmpty) {
        _locale = Locale(lang);
      }
      final hour = prefs.getInt('reminderHour');
      if (hour != null) _reminderHour = hour;
      // schedule reminder if notifications are available
      try {
        await NotificationHelper.scheduleDailyReminderSafe(0, AppLocalizationsDelegateStub.title, AppLocalizationsDelegateStub.body, _reminderHour, 0);
      } catch (_) {}
      notifyListeners();
    } catch (_) {}
  }

  Future<void> _saveToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonList = _tasks.map((t) => t.toJson()).toList();
      await prefs.setString('tasks', jsonEncode(jsonList));
      if (_locale != null) await prefs.setString('locale', _locale!.languageCode);
      await prefs.setInt('reminderHour', _reminderHour);
    } catch (_) {}
  }

  void _loadInitialData() {
    // Only load sample tasks if none persisted
    if (_tasks.isEmpty) {
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
    }
    notifyListeners();
  }

  // Add a task
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
    _saveToPrefs();
    notifyListeners();
  }

  // Complete a task
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

      _saveToPrefs();
      notifyListeners();
    }
  }

  void deleteTask(String taskId) {
    _tasks.removeWhere((task) => task.id == taskId);
    _saveToPrefs();
    notifyListeners();
  }

  // Buy item
  bool buyItem(int cost) {
    if (_profile.totalPoints >= cost) {
      _profile = _profile.copyWith(totalPoints: _profile.totalPoints - cost);
      _saveToPrefs();
      notifyListeners();
      return true;
    }
    return false;
  }

  // Reminder scheduling
  Future<void> setReminderHour(int hour) async {
    _reminderHour = hour;
    _saveToPrefs();
    // schedule notification id 0
    try {
      await NotificationHelper.scheduleDailyReminderSafe(0, 'Rappel', 'N\'oublie pas tes tâches !', _reminderHour, 0);
    } catch (_) {}
    notifyListeners();
  }
}

/// Small stub to provide title/body at startup when localization class might not be ready.
/// NotificationHelper will accept raw title/body strings.
class AppLocalizationsDelegateStub {
  static String get title => 'Rappel';
  static String get body => 'N\'oublie pas tes tâches !';
}
