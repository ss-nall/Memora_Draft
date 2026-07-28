import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:firebase_core/firebase_core.dart';
// import 'package:hive_flutter/hive_flutter.dart';

import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase (Uncomment when google-services.json is added)
  // await Firebase.initializeApp();

  // Initialize Hive
  // await Hive.initFlutter();

  runApp(
    const ProviderScope(
      child: KnowledgeLensApp(),
    ),
  );
}

class KnowledgeLensApp extends StatelessWidget {
  const KnowledgeLensApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AR KnowledgeLens',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: const PlaceholderScreen(),
    );
  }
}

class PlaceholderScreen extends StatelessWidget {
  const PlaceholderScreen({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AR KnowledgeLens'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.view_in_ar, size: 80, color: Colors.blue),
            SizedBox(height: 16),
            Text(
              'Welcome to AR KnowledgeLens',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text('AI-Powered AR Learning Platform'),
          ],
        ),
      ),
    );
  }
}
