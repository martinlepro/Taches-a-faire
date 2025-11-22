// lib/screens/tasks_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart'; // NÉCESSAIRE

import '../models/task.dart'; 
import '../state/app_state.dart'; // NÉCESSAIRE

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  // Contrôleur pour l'input d'ajout de tâche
  final TextEditingController _taskController = TextEditingController(); 

  // Définition par défaut de la difficulté pour l'input
  String _selectedDifficulty = 'medium'; 

  // NOUVEAU: Supprimer la liste de tâches temporaire (elle est maintenant dans AppState)
  // List<Task> tasks = [...]; 


  @override
  Widget build(BuildContext context) {
    // 1. OBTENIR l'instance de l'état (Appeler Provider.of<AppState>)
    final appState = Provider.of<AppState>(context);
    final tasks = appState.tasks; // Lire la liste de tâches depuis l'état central

    // 2. Filtrer les tâches non complétées (similaire à ce que faisait app.js)
    final todoTasks = tasks.where((t) => !t.completed).toList();

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
          
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _taskController,
                  decoration: InputDecoration(
                    hintText: 'Ajouter une nouvelle tâche...',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Sélecteur de Difficulté
              DropdownButton<String>(
                value: _selectedDifficulty,
                items: const [
                  DropdownMenuItem(value: 'easy', child: Text('Facile (+1)')),
                  DropdownMenuItem(value: 'medium', child: Text('Moyen (+3)')),
                  DropdownMenuItem(value: 'hard', child: Text('Difficile (+5)')),
                ],
                onChanged: (String? newValue) {
                  if (newValue != null) {
                    setState(() {
                      _selectedDifficulty = newValue;
                    });
                  }
                },
              ),
              const SizedBox(width: 8),
              // Bouton Ajouter
              IconButton(
                icon: const Icon(Icons.add_task, color: Colors.deepPurple, size: 30),
                onPressed: () {
                  if (_taskController.text.isNotEmpty) {
                      // 3. Appeler la méthode addTask de AppState
                      appState.addTask(
                        _taskController.text, 
                        _selectedDifficulty, 
                        false // isRecurring: false pour l'instant
                      ); 
                      _taskController.clear();
                  }
                },
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          // 2. Titre et Filtres/Contrôles
          // --- CORRECTION APPLIQUÉE ICI ---
          // Le mot-clé 'const' a été retiré car todoTasks.length est une variable.
          Text(
            'Tâches à faire (${todoTasks.length})', 
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)
          ),
          const SizedBox(height: 10),

          // 3. Liste des Tâches (ListView.builder)
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: todoTasks.length,
            itemBuilder: (context, index) {
              final task = todoTasks[index];
              return Card(
                color: Colors.white,
                margin: const EdgeInsets.symmetric(vertical: 4.0),
                child: ListTile(
                  leading: Checkbox(
                    value: task.completed,
                    onChanged: (bool? newValue) {
                      // 4. Appeler la méthode completeTask de AppState
                      appState.completeTask(task.id);
                    },
                  ),
                  title: Text(
                    task.text,
                  ),
                  subtitle: Text(
                    '${task.difficulty.toUpperCase()} | ${task.points} pts ${task.isRecurring ? ' (Répétition)' : ''}',
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red),
                    onPressed: () {
                      // 5. Appeler la méthode deleteTask de AppState
                      appState.deleteTask(task.id);
                    },
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
