# AR KnowledgeLens

An AI-Powered Context-Aware Augmented Reality Learning Platform.

## Project Structure
- `lib/core/`: Application-wide configurations (theme, constants, errors).
- `lib/models/`: Data models for Topics, Users, etc.
- `lib/providers/`: Riverpod state management.
- `lib/services/`: Firebase, Gemini, and AR module integration.
- `lib/ui/`: UI components and screens.

## Next Steps
Once you have installed the Flutter SDK:
1. Run `flutter create .` inside this directory to generate the platform-specific folders (android, ios, web).
2. Run `flutter pub get` to install all dependencies from `pubspec.yaml`.
3. Set up the Firebase project and add the `google-services.json` / `GoogleService-Info.plist` files.
