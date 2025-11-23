// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart'; // NÉCESSAIRE

// Importations des fichiers locaux
import 'screens/tasks_screen.dart'; 
import 'screens/shop_screen.dart';
import 'models/task.dart'; 
import 'models/profile.dart'; 
import 'state/app_state.dart'; 

// 🔑 NOUVEAU: Imports pour l'internationalisation
import 'package:flutter_localizations/flutter_localizations.dart'; 
import 'package:flutter_gen/gen_l10n/app_localizations.dart'; // Fichier généré

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
      
      // --- CONFIGURATION DE L'INTERNATIONALISATION (i18n) ---
      // 🔑 CORRECTION MAJEURE: Retire le mot-clé 'const' ici!
      localizationsDelegates: [ 
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      // La liste des langues supportées peut rester constante
      supportedLocales: const [
        Locale('en'), // Anglais
        Locale('fr'), // Français
        // Ajoutez d'autres Locales supportées ici
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
      home: const MainScreen(),
    );
  }
}

// ==============================================\n// Écran Principal (Gère la Navigation par Onglets)\n// ==============================================\nclass MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const TasksScreen(),
    const ShopScreen(),
    const Center(child: Text("Statistiques")),
    const Center(child: Text("Profil")),
    const Center(child: Text("Social")),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    // 🔑 CORRECTION: Récupération de l'objet de localisation
    final localizations = AppLocalizations.of(context)!; 

    String currentTitle;
    switch (_selectedIndex) {
      case 0:
        // 🔑 Utilisation des clés localisées (doivent être définies dans vos fichiers .arb)
        currentTitle = localizations.tasksTitle; 
        break;
      case 1:
        currentTitle = localizations.shopTitle; 
        break;
      case 2:
        currentTitle = localizations.statsTitle;
        break;
      case 3:
        currentTitle = localizations.profileTitle;
        break;
      case 4:
        currentTitle = localizations.socialTitle;
        break;
      default:
        currentTitle = 'To-Do Gamifiée';
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(currentTitle),
      ),
      body: _screens[_selectedIndex],
      
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(8.0), 
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
