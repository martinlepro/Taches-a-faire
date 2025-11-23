// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart'; 

// Importations des fichiers locaux
import 'screens/tasks_screen.dart'; 
import 'screens/shop_screen.dart';
import 'models/task.dart'; 
import 'models/profile.dart'; 
import 'state/app_state.dart'; 

// 🔑 Imports pour l'internationalisation
import 'package:flutter_localizations/flutter_localizations.dart'; 
import 'package:flutter_gen/gen_l10n/app_localizations.dart'; // Fichier généré

void main() {
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
      
      // --- CONFIGURATION DE L'INTERNATIONALISATION (i18n) ---
      localizationsDelegates: [ 
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en'), 
        Locale('fr'), 
      ],
      // ----------------------------------------------------
      
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
      // ⬅️ NOTE : Le widget MainScreen est ici appelé sans 'const'
      home: MainScreen(),
    );
  }
}

// ==============================================
// Écran Principal (Gère la Navigation par Onglets)
// ==============================================
class MainScreen extends StatefulWidget {
  // ⬅️ CORRECTION : Suppression du mot-clé 'const' ici
  MainScreen({super.key}); 

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  static final List<Widget> _widgetOptions = <Widget>[
    const TasksScreen(), 
    const ShopScreen(),
    const Text('Stats Screen Placeholder'),
    const Text('Profile Screen Placeholder'),
    const Text('Social Screen Placeholder'),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    // 🔑 Obtient les chaînes localisées une seule fois
    final localizations = AppLocalizations.of(context)!;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.appTitle), // 🔑 Utilisation du titre localisé
        elevation: 0,
      ),
      body: Center(
        child: _widgetOptions.elementAt(_selectedIndex),
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 10.0),
        child: Container(
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
            // 🔑 Utilisation des chaînes localisées pour les étiquettes
            items: <BottomNavigationBarItem>[
              BottomNavigationBarItem(
                icon: const Icon(Icons.list_alt, size: 28),
                label: localizations.tasks, 
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.store, size: 28),
                label: localizations.shop, 
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.show_chart, size: 28),
                label: localizations.stats,
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.person, size: 28),
                label: localizations.profile,
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.group, size: 28),
                label: localizations.social,
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
