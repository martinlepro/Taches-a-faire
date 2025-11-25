// lib/screens/tasks_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';

import '../models/task.dart';
import '../state/app_state.dart';
import '../l10n/app_localizations.dart'; // IMPORT LOCALIZATIONS

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  final TextEditingController _taskController = TextEditingController();
  String _selectedDifficulty = 'medium';

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final tasks = appState.tasks;
    final todoTasks = tasks.where((t) => !t.completed).toList();
    final loc = AppLocalizations.of(context)!;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title from localization
          Text(
            loc.addTaskTitle,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _taskController,
                  decoration: InputDecoration(
                    hintText: loc.addHint,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              DropdownButton<String>(
                value: _selectedDifficulty,
                items: [
                  DropdownMenuItem(value: 'easy', child: Text(loc.difficultyEasyLabel)),
                  DropdownMenuItem(value: 'medium', child: Text(loc.difficultyMediumLabel)),
                  DropdownMenuItem(value: 'hard', child: Text(loc.difficultyHardLabel)),
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
              IconButton(
                icon: const Icon(Icons.add_task, color: Colors.deepPurple, size: 30),
                onPressed: () {
                  if (_taskController.text.isNotEmpty) {
                    appState.addTask(
                      _taskController.text,
                      _selectedDifficulty,
                      false,
                    );
                    _taskController.clear();
                  }
                },
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Header localized + count
          Text(
            '${loc.todoListHeader} (${todoTasks.length})',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
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
                      // Complete task + haptic feedback
                      appState.completeTask(task.id);
                      try {
                        HapticFeedback.lightImpact();
                      } catch (_) {}
                    },
                  ),
                  title: Text(task.text),
                  subtitle: Text(
                    '${task.difficulty.toUpperCase()} | ${task.points} ${loc.pointsShort} ${task.isRecurring ? ' (${loc.recurring})' : ''}',
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red),
                    onPressed: () {
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
