// lib/screens/shop_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart'; // NÉCESSAIRE
import '../state/app_state.dart'; // NÉCESSAIRE


class ShopScreen extends StatelessWidget {
  const ShopScreen({super.key});

  final List<Map<String, dynamic>> shopItems = const [
    {'name': 'Nouvelle Icône (Star)', 'cost': 100, 'icon': Icons.star},
    {'name': 'Changer de Thème', 'cost': 500, 'icon': Icons.color_lens},
    {'name': 'Bonus Point x2 (1 jour)', 'cost': 1000, 'icon': Icons.monetization_on},
    {'name': 'Effacer 1 Tâche Pénible', 'cost': 2000, 'icon': Icons.delete_forever},
  ];

  @override
  Widget build(BuildContext context) {
    // 1. OBTENIR l'instance de l'état (lecture des données du profil)
    final appState = Provider.of<AppState>(context);
    final profile = appState.profile;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '🛒 Boutique d\'Améliorations',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          const Text(
            'Dépensez vos points pour des récompenses et des cosmétiques !',
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
          const SizedBox(height: 20),
          
          // Solde de points (Maintenant connecté au profile réel)
          Card(
            color: Colors.amber[50],
            child: ListTile(
              leading: const Icon(Icons.flash_on, color: Colors.amber, size: 30),
              title: const Text('Votre Solde Actuel'),
              trailing: Text(
                '${profile.totalPoints} 🌟', // UTILISE LES POINTS RÉELS
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.amber),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Liste des articles de la boutique
          ...shopItems.map((item) {
            final cost = item['cost'] as int;
            final canBuy = profile.totalPoints >= cost; // Vérifie si l'utilisateur a assez de points
            
            return Card(
              margin: const EdgeInsets.symmetric(vertical: 8.0),
              child: ListTile(
                leading: Icon(item['icon'] as IconData, color: Theme.of(context).primaryColor),
                title: Text(item['name'] as String),
                trailing: ElevatedButton(
                  onPressed: canBuy
                      ? () {
                          // 2. Appeler la méthode buyItem de AppState
                          bool success = appState.buyItem(cost);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(success ? 'Achat réussi !' : 'Points insuffisants.'),
                              backgroundColor: success ? Colors.green : Colors.red,
                            ),
                          );
                        }
                      : null, // Désactive le bouton si l'utilisateur n'a pas assez de points
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor.withOpacity(canBuy ? 1.0 : 0.5),
                    foregroundColor: Colors.white,
                  ),
                  child: Text('${cost} pts'),
                ),
              ),
            );
          }).toList(),
        ],
      ),
    );
  }
}
