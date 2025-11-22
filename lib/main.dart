// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart'; // NÉCESSAIRE
import 'screens/tasks_screen.dart'; 
import 'screens/shop_screen.dart';
import 'models/task.dart'; 
import 'models/profile.dart'; 
import 'state/app_state.dart'; 


void main() {
  // Le point d'entrée crée et fournit l'état AppState à tous les widgets enfants
  runApp(
    ChangeNotifierProvider(
      create: (context) => AppState(), 
      child: const GamifiedTodoApp(),
    ),
  );
}


class GamifiedTodoApp extends StatelessWidget {
  const GamifiedTodoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ma To-Do List Gamifiée',
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
  static const List<Widget> _screens = <Widget>[
    TasksScreen(), // Écran réel
    ShopScreen(), // Écran réel
    Center(child: Text('3. Écran des Statistiques', style: TextStyle(fontSize: 20))),
    Center(child: Text('4. Écran du Profil', style: TextStyle(fontSize: 20))),
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
      
      body: _screens.elementAt(_selectedIndex),
      
      // Barre de navigation personnalisée avec fond blanc arrondi
      bottomNavigationBar: BottomAppBar(
        color: Colors.transparent, 
        elevation: 0, 
        child: Container(
          height: 60, 
          margin: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 5.0), 
          decoration: BoxDecoration(
            color: Colors.white, 
            borderRadius: BorderRadius.circular(25.0), 
            boxShadow: [
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
            selectedItemColor: Theme.of(context).primaryColor,
            unselectedItemColor: Colors.grey,
            onTap: _onItemTapped,
            type: BottomNavigationBarType.fixed, 
            backgroundColor: Colors.transparent, 
            elevation: 0, 
            showUnselectedLabels: true,
          ),
        ),
      ),
    );
  }
}
