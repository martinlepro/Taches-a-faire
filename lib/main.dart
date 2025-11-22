// lib/main.dart
import 'package:flutter/material.dart';
// Note: Le package 'dart:math' n'est plus nécessaire ici car nous avons enlevé le calcul du niveau pour la démo.
// Importez vos futurs modèles ici:
// import 'models/task.dart';
// import 'models/profile.dart'; 

void main() {
  // Lancer l'application, l'état sera géré par un Provider ou BLoC dans une application réelle.
  runApp(const GamifiedTodoApp());
}

class GamifiedTodoApp extends StatelessWidget {
  const GamifiedTodoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ma To-Do List Gamifiée',
      // Définition d'un thème clair pour l'application
      theme: ThemeData(
        primarySwatch: Colors.deepPurple,
        primaryColor: Colors.deepPurple,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.deepPurple,
          foregroundColor: Colors.white,
          centerTitle: true,
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.grey[50],
      ),
      home: const MainScreen(),
    );
  }
}

// ==============================================
// Écran Principal (Gère la Navigation par Onglets)
// ==============================================
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  // Liste des écrans à afficher pour chaque onglet.
  // Ces classes de Widgets sont à créer par la suite (e.g., TasksScreen(), ShopScreen(), etc.)
  static const List<Widget> _screens = <Widget>[
    // Onglet Tâches
    Center(child: Text('1. Écran des Tâches (TODO List)', style: TextStyle(fontSize: 20))), 
    // Onglet Boutique
    Center(child: Text('2. Écran de la Boutique', style: TextStyle(fontSize: 20))),
    // Onglet Statistiques
    Center(child: Text('3. Écran des Statistiques', style: TextStyle(fontSize: 20))),
    // Onglet Profil
    Center(child: Text('4. Écran du Profil', style: TextStyle(fontSize: 20))),
    // Onglet Social
    Center(child: Text('5. Écran Social (à développer)', style: TextStyle(fontSize: 20))),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ma To-Do List Gamifiée'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              // Dans Flutter, cela ouvrirait une Modal ou un Drawer
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Ouverture des Réglages...'))
              );
            },
          ),
        ],
      ),
      
      // Contenu de l'écran actuellement sélectionné
      body: _screens.elementAt(_selectedIndex),
      
      // Barre de navigation par onglets (Bottom Navigation Bar)
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.list_alt),
            label: 'Tâches',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.store),
            label: 'Boutique',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.show_chart),
            label: 'Stats',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profil',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.group),
            label: 'Social',
          ),
        ],
        currentIndex: _selectedIndex,
        // Couleurs
        selectedItemColor: Theme.of(context).primaryColor,
        unselectedItemColor: Colors.grey,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed, // Nécessaire pour 5+ éléments
      ),
    );
  }
}
