// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart'; 
import 'package:flutter_localizations/flutter_localizations.dart'; // NOUVEAU
import 'package:flutter_gen/gen_l10n/app_localizations.dart';     // NOUVEAU (fichier généré)

import 'screens/tasks_screen.dart'; 
import 'screens/shop_screen.dart';
// NOTE: Les autres imports de modèles/state ont été omis pour la clarté, mais ils doivent rester

import 'state/app_state.dart'; 


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
    // 1. AJOUTER LA CONFIGURATION DES LOCALISATIONS
    return MaterialApp(
      // --- INTERNATIONALISATION (i18n) ---
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en'), // Anglais
        Locale('fr'), // Français
        Locale('de'), // Allemand
        Locale('es'), // Espagnol
        Locale('it'), // Italien
        Locale('nl'), // Néerlandais
        Locale('pt'), // Portugais
        // Ajoutez d'autres si nécessaire (ex: Locale('ru'), Locale('pl'), Locale('sv'))
      ],
      
      title: 'Ma To-Do List Gamifiée', // Peut être remplacé par un appel i18n si vous le souhaitez
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

  static const List<Widget> _screens = <Widget>[
    TasksScreen(),
    ShopScreen(),
    // ... les autres écrans (Stats, Profile, Social)
    Center(child: Text('Stats Écran')),
    Center(child: Text('Profil Écran')),
    Center(child: Text('Social Écran')),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    // NOUVEAU : OBTENIR L'OBJET DE TRADUCTION
    final localizations = AppLocalizations.of(context)!;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(_screens[_selectedIndex].toStringShort()), // À modifier plus tard
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: Container(
        // ... (votre code pour le décor de la barre de navigation)
        child: ClipRRect(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(25.0),
            topRight: Radius.circular(25.0),
          ),
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
              // REMPLACER LES ÉTIQUETTES (LABELS) EN DUR PAR LES CLÉS DE TRADUCTION
              items: <BottomNavigationBarItem>[
                BottomNavigationBarItem(
                  icon: const Icon(Icons.list_alt, size: 28),
                  label: localizations.tasksTabTitle, // UTILISATION i18n
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.store, size: 28),
                  label: localizations.shopTabTitle, // UTILISATION i18n
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.show_chart, size: 28),
                  label: localizations.statsTabTitle, // UTILISATION i18n
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.person, size: 28),
                  label: localizations.profileTabTitle, // UTILISATION i18n
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.group, size: 28),
                  label: localizations.socialTabTitle, // UTILISATION i18n
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
              
              // --- CORRECTION DE LA TAILLE DE POLICE POUR ÉVITER LA TRONCATURE ---
              selectedFontSize: 12.0,
              unselectedFontSize: 12.0,
              // ----------------------------------------------------------------
            ),
          ),
        ),
      ),
    );
  }
}
