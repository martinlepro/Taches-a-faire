// lib/screens/stats_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';

import '../state/app_state.dart';
import '../l10n/app_localizations.dart';

class StatsScreen extends StatelessWidget {
  const StatsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final loc = AppLocalizations.of(context)!;

    final completedTasks = appState.tasks.where((t) => t.completed).toList();

    if (completedTasks.isEmpty) {
      return Center(
        child: Text(loc.statsNoData),
      );
    }

    // Points total gagnés
    final totalPointsGained = completedTasks.fold<int>(0, (s, t) => s + t.points);

    // Points / difficulty
    final Map<String, int> pointsByDifficulty = {'easy': 0, 'medium': 0, 'hard': 0};
    final Map<String, int> countsByDifficulty = {'easy': 0, 'medium': 0, 'hard': 0};

    for (var t in completedTasks) {
      final d = t.difficulty;
      pointsByDifficulty[d] = (pointsByDifficulty[d] ?? 0) + t.points;
      countsByDifficulty[d] = (countsByDifficulty[d] ?? 0) + 1;
    }

    // Moyennes (points / tâche) par difficulté
    final Map<String, double> avgByDifficulty = {};
    for (var key in pointsByDifficulty.keys) {
      final pts = pointsByDifficulty[key] ?? 0;
      final cnt = countsByDifficulty[key] ?? 0;
      avgByDifficulty[key] = cnt > 0 ? pts / cnt : 0.0;
    }

    // Cumulative points (par ordre d'apparition des tâches complétées)
    List<int> cumulative = [];
    int accum = 0;
    for (var t in completedTasks) {
      accum += t.points;
      cumulative.add(accum);
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            loc.statsTitle,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 12),

          Card(
            child: ListTile(
              leading: const Icon(Icons.star, color: Colors.amber),
              title: Text(loc.statsPointsGained),
              trailing: Text('$totalPointsGained ${loc.pointsShort}', style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),

          const SizedBox(height: 20),

          Text(loc.statsByDifficulty, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),

          SizedBox(
            height: 220,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: (pointsByDifficulty.values.fold<int>(0, (p, e) => p > e ? p : e)).toDouble() + 2,
                barTouchData: BarTouchData(enabled: true),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        final idx = value.toInt();
                        final map = ['Easy', 'Medium', 'Hard'];
                        if (idx >= 0 && idx < map.length) {
                          return Text(map[idx]);
                        } else {
                          return const Text('');
                        }
                      },
                      reservedSize: 30,
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: [
                  BarChartGroupData(x: 0, barRods: [BarChartRodData(toY: (pointsByDifficulty['easy'] ?? 0).toDouble(), color: Colors.green)]),
                  BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: (pointsByDifficulty['medium'] ?? 0).toDouble(), color: Colors.orange)]),
                  BarChartGroupData(x: 2, barRods: [BarChartRodData(toY: (pointsByDifficulty['hard'] ?? 0).toDouble(), color: Colors.red)]),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Moyennes
          Card(
            margin: const EdgeInsets.symmetric(vertical: 8),
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(loc.statsAvgPoints, style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _statColumn('Easy', avgByDifficulty['easy'] ?? 0),
                      _statColumn('Medium', avgByDifficulty['medium'] ?? 0),
                      _statColumn('Hard', avgByDifficulty['hard'] ?? 0),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          Text(loc.statsCumulative, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),

          SizedBox(
            height: 200,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: true),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true)),
                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, m) {
                    final idx = v.toInt();
                    return Text('${idx + 1}');
                  })),
                ),
                borderData: FlBorderData(show: true),
                lineBarsData: [
                  LineChartBarData(
                    spots: List.generate(cumulative.length, (i) => FlSpot(i.toDouble(), cumulative[i].toDouble())),
                    isCurved: true,
                    barWidth: 3,
                    dotData: FlDotData(show: true),
                    color: Theme.of(context).primaryColor,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statColumn(String label, double value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Text(value.toStringAsFixed(1)),
      ],
    );
  }
}
