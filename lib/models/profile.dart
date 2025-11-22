// lib/models/profile.dart
import 'dart:math'; // Pour la fonction sqrt()

class Profile {
  final String icon;
  final int totalPoints;
  final int currentStreak;
  final int maxStreak;

  Profile({
    required this.icon,
    required this.totalPoints,
    required this.currentStreak,
    required this.maxStreak,
  });
  
  // NOUVEAU: Le niveau est une propriété "Getter" (calculée à la volée)
  int get level {
    // La formule de niveau que nous avions en JS
    return (totalPoints / 100).sqrt().floor();
  }

  // --- Sérialisation JSON ---
  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      icon: json['icon'] as String? ?? '👤',
      totalPoints: json['totalPoints'] as int? ?? 0,
      currentStreak: json['currentStreak'] as int? ?? 0,
      maxStreak: json['maxStreak'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'icon': icon,
      'totalPoints': totalPoints,
      'currentStreak': currentStreak,
      'maxStreak': maxStreak,
    };
  }
}
