// lib/screens/shop_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/app_state.dart';
import '../l10n/app_localizations.dart'; // IMPORT LOCALIZATIONS

class ShopScreen extends StatelessWidget {
  const ShopScreen({super.key});

  final List<Map<String, dynamic>> shopItems = const [
    {'nameKey': 'shop_item_star', 'cost': 100, 'icon': Icons.star},
    {'nameKey': 'shop_item_theme', 'cost': 500, 'icon': Icons.color_lens},
    {'nameKey': 'shop_item_x2', 'cost': 1000, 'icon': Icons.monetization_on},
    {'nameKey': 'shop_item_erase', 'cost': 2000, 'icon': Icons.delete_forever},
  ];

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final profile = appState.profile;
    final loc = AppLocalizations.of(context)!;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '🛒 ${loc.shopTitle}',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          Text(
            loc.shopSubtitle,
            style: const TextStyle(fontSize: 16, color: Colors.grey),
          ),
          const SizedBox(height: 20),

          // Solde de points (Maintenant connecté au profile réel)
          Card(
            color: Colors.amber[50],
            child: ListTile(
              leading: const Icon(Icons.flash_on, color: Colors.amber, size: 30),
              title: Text(loc.currentBalance),
              trailing: Text(
                '${profile.totalPoints} 🌟',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.amber),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Liste des articles de la boutique
          ...shopItems.map((item) {
            final cost = item['cost'] as int;
            final canBuy = profile.totalPoints >= cost;
            final nameKey = item['nameKey'] as String;
            final itemName = _getLocalizedShopItemName(loc, nameKey);

            return Card(
              margin: const EdgeInsets.symmetric(vertical: 8.0),
              child: ListTile(
                leading: Icon(item['icon'] as IconData, color: Theme.of(context).primaryColor),
                title: Text(itemName),
                trailing: ElevatedButton(
                  onPressed: canBuy
                      ? () {
                          bool success = appState.buyItem(cost);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(success ? loc.purchaseSuccess : loc.insufficientPoints),
                              backgroundColor: success ? Colors.green : Colors.red,
                            ),
                          );
                        }
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor.withOpacity(canBuy ? 1.0 : 0.5),
                    foregroundColor: Colors.white,
                  ),
                  child: Text('${cost} ${loc.pointsShort}'),
                ),
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  String _getLocalizedShopItemName(AppLocalizations loc, String key) {
    switch (key) {
      case 'shop_item_star':
        return loc.shopItemStar;
      case 'shop_item_theme':
        return loc.shopItemTheme;
      case 'shop_item_x2':
        return loc.shopItemX2;
      case 'shop_item_erase':
        return loc.shopItemErase;
      default:
        return key;
    }
  }
}
