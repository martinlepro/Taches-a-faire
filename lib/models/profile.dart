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
  
  // NOUVEAU: Méthode copyWith (Permet de créer une copie modifiée facilement)
  Profile copyWith({
    String? icon,
    int? totalPoints,
    int? currentStreak,
    int? maxStreak,
  }) {
    return Profile(
      icon: icon ?? this.icon,
      totalPoints: totalPoints ?? this.totalPoints,
      currentStreak: currentStreak ?? this.currentStreak,
      maxStreak: maxStreak ?? this.maxStreak,
    );
  }
  
  // NOUVEAU: Le niveau est une propriété "Getter" (calculée à la volée)
  int get level {
    // --- CORRECTION APPLIQUÉE ICI ---
    // On utilise la fonction sqrt() qui englobe le calcul.
    return sqrt(totalPoints / 100).floor();
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
