// lib/models/task.dart
import 'dart:convert'; // Nécessaire pour la conversion JSON

class Task {
  final String id;
  final String text;
  final bool completed;
  final String difficulty;
  final int points;
  final bool isRecurring;
  final String? recurrenceType;
  final int recurrenceValue;
  final String? dueTime;

  Task({
    required this.id,
    required this.text,
    required this.completed,
    required this.difficulty,
    required this.points,
    this.isRecurring = false,
    this.recurrenceType,
    this.recurrenceValue = 1,
    this.dueTime,
  });

  // Méthode pour copier et modifier un objet immuable (très fréquent en Dart/Flutter)
  Task copyWith({
    String? id,
    String? text,
    bool? completed,
    String? difficulty,
    int? points,
    bool? isRecurring,
    String? recurrenceType,
    int? recurrenceValue,
    String? dueTime,
  }) {
    return Task(
      id: id ?? this.id,
      text: text ?? this.text,
      completed: completed ?? this.completed,
      difficulty: difficulty ?? this.difficulty,
      points: points ?? this.points,
      isRecurring: isRecurring ?? this.isRecurring,
      recurrenceType: recurrenceType ?? this.recurrenceType,
      recurrenceValue: recurrenceValue ?? this.recurrenceValue,
      dueTime: dueTime ?? this.dueTime,
    );
  }

  // Créer un objet Task à partir d'une map (JSON)
  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'] as String,
      text: json['text'] as String,
      completed: json['completed'] as bool,
      difficulty: json['difficulty'] as String,
      points: json['points'] as int,
      isRecurring: json['isRecurring'] as bool? ?? false,
      recurrenceType: json['recurrenceType'] as String?,
      recurrenceValue: json['recurrenceValue'] as int? ?? 1,
      dueTime: json['dueTime'] as String?,
    );
  }

  // Convertir l'objet Task en map (JSON)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'completed': completed,
      'difficulty': difficulty,
      'points': points,
      'isRecurring': isRecurring,
      'recurrenceType': recurrenceType,
      'recurrenceValue': recurrenceValue,
      'dueTime': dueTime,
    };
  }
}
