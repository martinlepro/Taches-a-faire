// lib/screens/tasks_screen.dart
import 'package:flutter/material.dart';
import '../models/task.dart'; // Importe le modèle de donnée Task

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  // Liste de tâches temporaire pour la démo (sera remplacée par l'état global)
  List<Task> tasks = [
    Task(
      id: '1',
      text: 'Terminer le projet Flutter',
      completed: false,
      difficulty: 'hard',
      points: 5,
    ),
    Task(
      id: '2',
      text: 'Faire les courses (récurent)',
      completed: false,
      difficulty: 'easy',
      points: 1,
      isRecurring: true,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    // SingleChildScrollView permet de faire défiler le contenu si l'écran est petit
    return SingleChildScrollView( 
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Zone d'ajout de tâche (Input)
          const Text(
            'Ajouter une nouvelle tâche',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          
          TextField(
            decoration: InputDecoration(
              hintText: 'Ajouter une nouvelle tâche...',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              // Bouton 'Ajouter' dans le suffixe pour l'exemple
              suffixIcon: IconButton(
                icon: const Icon(Icons.add_task, color: Colors.deepPurple),
                onPressed: () {
                  // TODO: Implémenter la logique d'ajout (avec le State Manager)
                },
              ),
            ),
          ),
          const SizedBox(height: 20),
          
          // 2. Titre et Filtres/Contrôles
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Tâches à faire', 
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)
              ),
              DropdownButton<String>(
                value: 'default',
                items: const [
                  DropdownMenuItem(value: 'default', child: Text('Trier par Défaut')),
                  DropdownMenuItem(value: 'difficulty', child: Text('Difficulté')),
                  DropdownMenuItem(value: 'time', child: Text('Urgence')),
                ],
                onChanged: (String? newValue) {
                  // TODO: Implémenter la logique de tri
                },
              ),
            ],
          ),
          const SizedBox(height: 10),

          // 3. Liste des Tâches (ListView.builder)
          ListView.builder(
            // Ces deux lignes sont nécessaires si ListView est dans un SingleChildScrollView
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: tasks.length,
            itemBuilder: (context, index) {
              final task = tasks[index];
              return Card(
                color: task.completed ? Colors.green[50] : Colors.white,
                margin: const EdgeInsets.symmetric(vertical: 4.0),
                child: ListTile(
                  leading: Checkbox(
                    value: task.completed,
                    onChanged: (bool? newValue) {
                      setState(() {
                        // TODO: Implémenter le basculement d'état
                      });
                    },
                  ),
                  title: Text(
                    task.text,
                    style: TextStyle(
                      decoration: task.completed ? TextDecoration.lineThrough : TextDecoration.none,
                    ),
                  ),
                  subtitle: Text(
                    '${task.difficulty.toUpperCase()} | ${task.points} pts ${task.isRecurring ? ' (Répétition)' : ''}',
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red),
                    onPressed: () {
                      // TODO: Implémenter la suppression
                    },
                  ),
                  onTap: () {
                    // TODO: Ouvrir un formulaire d'édition
                  },
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
