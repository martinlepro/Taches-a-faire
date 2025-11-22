// lib/main.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart'; // Nécessite l'import
import 'screens/tasks_screen.dart'; 
import 'screens/shop_screen.dart';
import 'models/task.dart'; 
import 'models/profile.dart'; 

// 1. Importer le nouvel AppState
import 'state/app_state.dart'; 


void main() {
  // Le point d'entrée crée et fournit l'état AppState à tous les widgets enfants
  runApp(
    ChangeNotifierProvider(
      // 2. Créer l'instance de la classe d'état
      create: (context) => AppState(), 
      child: const GamifiedTodoApp(),
    ),
  );
}

// ... (Le reste du fichier MainScreen, etc. reste inchangé)
// Assurez-vous d'avoir bien importé TasksScreen et ShopScreen dans MainScreen si ce n'est pas déjà fait.


class GamifiedTodoApp extends StatelessWidget {
  const GamifiedTodoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ma To-Do List Gamifiée',
      // Définition du thème de l'application
      theme: ThemeData(
        primarySwatch: Colors.deepPurple,
        primaryColor: Colors.deepPurple,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.deepPurple,
          foregroundColor: Colors.white,
          centerTitle: true,
        ),
        useMaterial3: true,
        // Un fond léger pour le Scaffold
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
  // 3. Remplacer les placeholders (Text) par les classes d'écran réelles
  static const List<Widget> _screens = <Widget>[
    // Onglet Tâches (Utilise le nouvel écran)
    TasksScreen(), 
    // Onglet Boutique (Utilise le nouvel écran)
    ShopScreen(),
    // Onglet Statistiques (Placeholders, à créer plus tard)
    Center(child: Text('3. Écran des Statistiques', style: TextStyle(fontSize: 20))),
    // Onglet Profil (Placeholders, à créer plus tard)
    Center(child: Text('4. Écran du Profil', style: TextStyle(fontSize: 20))),
    // Onglet Social (Placeholders, à créer plus tard)
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
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Ouverture des Réglages...'))
              );
            },
          ),
        ],
      ),
      
      // Contenu de l'écran actuellement sélectionné
      body: _screens.elementAt(_selectedIndex),
      
      // NOUVEAU : BottomAppBar pour le style arrondi et l'ombre
      bottomNavigationBar: BottomAppBar(
        color: Colors.transparent, // Rendre le fond du BottomAppBar transparent
        elevation: 0, // Enlever l'ombre par défaut
        child: Container(
          height: 60, // Hauteur de la barre
          margin: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 5.0), // Marge pour l'effet "flottant"
          decoration: BoxDecoration(
            color: Colors.white, // Fond blanc
            borderRadius: BorderRadius.circular(25.0), // Bord arrondi
            boxShadow: [
              // Légère ombre pour mettre en valeur le rectangle
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                spreadRadius: 2,
                blurRadius: 15,
                offset: const Offset(0, 5), 
              ),
            ],
          ),
          child: BottomNavigationBar(
            items: const <BottomNavigationBarItem>[
              BottomNavigationBarItem(
                icon: Icon(Icons.list_alt, size: 28),
                label: 'Tâches',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.store, size: 28),
                label: 'Boutique',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.show_chart, size: 28),
                label: 'Stats',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person, size: 28),
                label: 'Profil',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.group, size: 28),
                label: 'Social',
              ),
            ],
            currentIndex: _selectedIndex,
            // Couleurs
            selectedItemColor: Theme.of(context).primaryColor,
            unselectedItemColor: Colors.grey,
            onTap: _onItemTapped,
            type: BottomNavigationBarType.fixed, // Important pour 5 éléments
            
            // Propriétés pour un look épuré dans le conteneur :
            backgroundColor: Colors.transparent, 
            elevation: 0, 
            showUnselectedLabels: true,
          ),
        ),
      ),
    );
  }
}
