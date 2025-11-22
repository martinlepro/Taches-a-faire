// lib/main.dart
import 'package:flutter/material.dart';
import 'dart:math'; // Pour la fonction sqrt() de calculateLevel

// Importez vos modèles (Task, Profile, etc.)
// import 'models/task.dart'; 
// ...

void main() {
  runApp(const GamifiedTodoApp());
}

class GamifiedTodoApp extends StatelessWidget {
  const GamifiedTodoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ma To-Do List Gamifiée',
      theme: ThemeData(
        primarySwatch: Colors.deepPurple,
        useMaterial3: true,
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

  // Remplace l'ancienne structure HTML/JS
  static const List<Widget> _screens = <Widget>[
    // Ces classes de Widgets sont à créer :
    Text('Écran des Tâches (TODO)'), 
    Text('Écran de la Boutique'),
    Text('Écran des Statistiques'),
    Text('Écran du Profil'),
    Text('Écran Social'),
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
              // Action pour ouvrir le menu Réglages (Modal/Drawer)
            },
          ),
        ],
      ),
      
      // Contenu de l'écran actuellement sélectionné
      body: Center(
        child: _screens.elementAt(_selectedIndex),
      ),
      
      // Barres de navigation par onglets (Bottom Navigation Bar)
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
        selectedItemColor: Colors.deepPurple,
        unselectedItemColor: Colors.grey,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed, // Important pour 5 éléments
      ),
    );
  }
}
