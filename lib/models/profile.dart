// lib/models/profile.dart

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
  
  // Le niveau est une propriété calculée, comme dans app.js
  int get level => (totalPoints / 100).sqrt().floor();

  // Méthodes fromJson et toJson similaires à Task pour la persistance
  // ... (à implémenter)
}
