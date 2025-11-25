// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'screens/tasks_screen.dart';
import 'screens/shop_screen.dart';
import 'state/app_state.dart';

import 'package:flutter_localizations/flutter_localizations.dart'; 
import 'package:flutter_gen/gen_l10n/app_localizations.dart'; // Fichier généré
import 'l10n/app_localizations.dart';

import 'notifications/notification_helper.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Initialise les notifications (mobile). Ne plante pas sur web.
  await NotificationHelper.initNotificationsSafe();
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
      locale: appState.locale,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en'),
        Locale('fr'),
        Locale('de'),
        Locale('es'),
        Locale('it'),
        Locale('pt'),
        Locale('ru'),
        Locale('zh'),
        Locale('ja'),
        Locale('nl'),
      ],
      localeResolutionCallback: (locale, supportedLocales) {
        if (appState.locale != null) return appState.locale;
        if (locale == null) return supportedLocales.first;
        for (var supported in supportedLocales) {
          if (supported.languageCode == locale.languageCode) return supported;
        }
        return supportedLocales.first;
      },
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

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

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
    final localizations = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.appTitle),
        elevation: 0,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.language),
            tooltip: 'Changer de langue',
            onSelected: (value) {
              if (value == 'system') {
                appState.clearLocale();
              } else {
                appState.setLocale(Locale(value));
              }
            },
            itemBuilder: (context) => const [
              PopupMenuItem(value: 'system', child: Text('Système')),
              PopupMenuItem(value: 'fr', child: Text('Français')),
              PopupMenuItem(value: 'en', child: Text('English')),
              PopupMenuItem(value: 'de', child: Text('Deutsch')),
              PopupMenuItem(value: 'es', child: Text('Español')),
              PopupMenuItem(value: 'it', child: Text('Italiano')),
              PopupMenuItem(value: 'pt', child: Text('Português')),
              PopupMenuItem(value: 'ru', child: Text('Русский')),
              PopupMenuItem(value: 'zh', child: Text('中文')),
              PopupMenuItem(value: 'ja', child: Text('日本語')),
              PopupMenuItem(value: 'nl', child: Text('Nederlands')),
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
            items: <BottomNavigationBarItem>[
              BottomNavigationBarItem(
                icon: const Icon(Icons.list_alt, size: 28),
                label: AppLocalizations.of(context)!.tasksTabTitle,
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.store, size: 28),
                label: AppLocalizations.of(context)!.shopTabTitle,
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.show_chart, size: 28),
                label: AppLocalizations.of(context)!.statsTabTitle,
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.person, size: 28),
                label: AppLocalizations.of(context)!.profileTabTitle,
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.group, size: 28),
                label: AppLocalizations.of(context)!.socialTabTitle,
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
