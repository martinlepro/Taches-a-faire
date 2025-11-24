// lib/notifications/notification_helper.dart
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tzdata;
import 'package:flutter_native_timezone/flutter_native_timezone.dart';

class NotificationHelper {
  static final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();

  static Future<void> initNotificationsSafe() async {
    try {
      if (kIsWeb) return;
    } catch (_) {}
    try {
      await initNotifications();
    } catch (_) {}
  }

  static Future<void> initNotifications() async {
    tzdata.initializeTimeZones();
    final String timeZoneName = await FlutterNativeTimezone.getLocalTimezone();
    tz.setLocalLocation(tz.getLocation(timeZoneName));

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    final ios = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestSoundPermission: true,
      requestBadgePermission: true,
    );
    final settings = InitializationSettings(android: android, iOS: ios);
    await _plugin.initialize(settings, onDidReceiveNotificationResponse: (response) {
      // handle tap
    });
  }

  static Future<void> scheduleDaily(int id, String title, String body, int hour, int minute) async {
    try {
      final tz.TZDateTime now = tz.TZDateTime.now(tz.local);
      tz.TZDateTime scheduled = tz.TZDateTime(tz.local, now.year, now.month, now.day, hour, minute);
      if (scheduled.isBefore(now)) scheduled = scheduled.add(const Duration(days: 1));

      await _plugin.zonedSchedule(
        id,
        title,
        body,
        scheduled,
        NotificationDetails(
          android: AndroidNotificationDetails('daily_channel', 'Daily reminders',
              channelDescription: 'Rappels quotidiens', importance: Importance.max, priority: Priority.high),
          iOS: DarwinNotificationDetails(),
        ),
        // androidAllowWhileIdle: true,        // <-- SUPPRIMÉ !
        uiLocalNotificationDateInterpretation: DateTimeInterpretation.absoluteTime, // <-- CORRIGÉ !
        matchDateTimeComponents: DateTimeComponents.time,
      );
    } catch (_) {}
  }

  static Future<void> cancel(int id) async {
    try {
      await _plugin.cancel(id);
    } catch (_) {}
  }

  static Future<void> scheduleDailyReminderSafe(int id, String title, String body, int hour, int minute) async {
    try {
      await scheduleDaily(id, title, body, hour, minute);
    } catch (_) {}
  }
}
