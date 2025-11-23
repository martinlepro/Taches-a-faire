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
// IMPORT : fichier généré par flutter gen-l10n (dans lib/l10n/)
import 'l10n/app_localizations.dart'; // Fichier généré par flutter gen-l10n

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
    final appState = Provider.of<AppState>(context);

    return MaterialApp(
      title: 'Ma To-Do List Gamifiée',

      // Utilise la locale stockée dans AppState (null -> système)
      locale: appState.locale,
      
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
      // Si on veut garder le comportement système en cas d'absence de sélection
      localeResolutionCallback: (locale, supportedLocales) {
        if (appState.locale != null) return appState.locale;
        // sinon laisser Flutter choisir en fonction du device
        if (locale == null) return supportedLocales.first;
        for (var supported in supportedLocales) {
          if (supported.languageCode == locale.languageCode) return supported;
        }
        return supportedLocales.first;
      },
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
    final appState = Provider.of<AppState>(context);
    // 🔑 Obtient les chaînes localisées une seule fois
    final localizations = AppLocalizations.of(context)!;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.appTitle), // titre localisé
        elevation: 0,
        actions: [
          // Bouton pour changer la langue
          PopupMenuButton<String>(
            icon: const Icon(Icons.language),
            tooltip: 'Changer de langue',
            onSelected: (value) {
              if (value == 'system') {
                appState.clearLocale(); // retourne au système
              } else {
                appState.setLocale(Locale(value));
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'system', child: Text('Système')),
              PopupMenuItem(value: 'fr', child: Text('Français')),
              PopupMenuItem(value: 'en', child: Text('English')),
            ],
          ),
        ],
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
            // Utilisation des getters générés par les .arb (ex: tasksTabTitle)
            items: <BottomNavigationBarItem>[
              BottomNavigationBarItem(
                icon: const Icon(Icons.list_alt, size: 28),
                label: localizations.tasksTabTitle, 
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.store, size: 28),
                label: localizations.shopTabTitle, 
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.show_chart, size: 28),
                label: localizations.statsTabTitle,
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.person, size: 28),
                label: localizations.profileTabTitle,
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.group, size: 28),
                label: localizations.socialTabTitle,
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
