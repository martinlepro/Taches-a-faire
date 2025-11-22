// lib/screens/shop_screen.dart
import 'package:flutter/material.dart';

class ShopScreen extends StatelessWidget {
  const ShopScreen({super.key});

  // Liste temporaire d'articles de la boutique (à définir dans un modèle plus tard)
  final List<Map<String, dynamic>> shopItems = const [
    {'name': 'Nouvelle Icône (Star)', 'cost': 100, 'icon': Icons.star},
    {'name': 'Changer de Thème', 'cost': 500, 'icon': Icons.color_lens},
    {'name': 'Bonus Point x2 (1 jour)', 'cost': 1000, 'icon': Icons.monetization_on},
    {'name': 'Effacer 1 Tâche Pénible', 'cost': 2000, 'icon': Icons.delete_forever},
  ];

  @override
  Widget build(BuildContext context) {
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
          
          // Solde de points (Placeholder)
          Card(
            color: Colors.amber[50],
            child: const ListTile(
              leading: Icon(Icons.flash_on, color: Colors.amber, size: 30),
              title: Text('Votre Solde Actuel'),
              trailing: Text(
                '0 🌟', // Sera connecté à l'état du profil
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.amber),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Liste des articles de la boutique
          ...shopItems.map((item) {
            return Card(
              margin: const EdgeInsets.symmetric(vertical: 8.0),
              child: ListTile(
                leading: Icon(item['icon'] as IconData, color: Theme.of(context).primaryColor),
                title: Text(item['name'] as String),
                trailing: ElevatedButton(
                  onPressed: () {
                    // TODO: Logique d'achat
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor,
                    foregroundColor: Colors.white,
                  ),
                  child: Text('${item['cost']} pts'),
                ),
              ),
            );
          }).toList(),
        ],
      ),
    );
  }
}
