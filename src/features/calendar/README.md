# Calendar Integration Guide (Admin Web & Mobile App)

This guide details the implementation structure of the **Calendar Tab** on the Admin Dashboard and the step-by-step instructions to integrate it into the Mobile Application (Flutter).

---

## 1. Database Schema (Firestore)

The calendar data is stored in the **`settings`** collection under multiple document IDs to ensure maximum compatibility with the mobile client. 

### Documents Updated:
1. `settings/calendar`
2. `settings/resource`
3. `settings/calendar_config`

### Document Payload Structure:
```json
{
  "pdfUrl": "https://firebasestorage.googleapis.com/.../calendar_file.pdf",
  "calendarUrl": "https://firebasestorage.googleapis.com/.../calendar_file.pdf",
  "url": "https://firebasestorage.googleapis.com/.../calendar_file.pdf",
  "buttonTitle": "View Calendar",
  "title": "View Calendar",
  "buttonText": "View Calendar",
  "updatedAt": "2026-05-27T12:16:34Z"
}
```
*Note: The system writes multiple duplicates for the PDF URL and Button Label to support whichever naming convention your mobile app currently expects.*

---

## 2. Admin Web Panel Codebase Structure

The calendar administration page is fully responsive, premium-styled, and consists of:
- **Service**: [calendarService.ts](file:///d:/LigthSuvara-Web-App/src/features/calendar/services/calendarService.ts) handles loading/writing configuration structures from/to Firestore.
- **Component View**: [Calendar.tsx](file:///d:/LigthSuvara-Web-App/src/pages/calendar/Calendar.tsx) hosts the UI containing file upload handlers, button title controls, live PDF preview container (`iframe`), and a reset-to-default option.
- **Routing**: Connected to `/calendar` in [routes/index.tsx](file:///d:/LigthSuvara-Web-App/src/routes/index.tsx).

---

## 3. Mobile App (Flutter/Dart) Integration Instructions

To connect your Flutter mobile app to this dashboard, follow these three steps:

### Step 3.1: Define the Config Model
Create a data model to parse the payload safely.

```dart
class AppCalendarConfig {
  final String pdfUrl;
  final String buttonTitle;

  AppCalendarConfig({
    required this.pdfUrl,
    required this.buttonTitle,
  });

  factory AppCalendarConfig.fromFirestore(Map<String, dynamic> data) {
    return AppCalendarConfig(
      pdfUrl: data['pdfUrl'] ?? data['calendarUrl'] ?? data['url'] ?? '/Suvara Calender.pdf',
      buttonTitle: data['buttonTitle'] ?? data['title'] ?? data['buttonText'] ?? 'View Calendar',
    );
  }
}
```

### Step 3.2: Implement the Firestore Service
Add a helper service to retrieve the calendar document from Firestore.

```dart
import 'package:cloud_firestore/cloud_firestore.dart';

class CalendarService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<AppCalendarConfig> fetchCalendarConfig() async {
    try {
      // Fetches the 'calendar' config document under the 'settings' collection
      DocumentSnapshot doc = await _db.collection('settings').doc('calendar').get();
      
      if (doc.exists && doc.data() != null) {
        return AppCalendarConfig.fromFirestore(doc.data() as Map<String, dynamic>);
      }
    } catch (e) {
      print("Error fetching calendar config: $e");
    }
    
    // Default fallback
    return AppCalendarConfig(
      pdfUrl: '/Suvara Calender.pdf',
      buttonTitle: 'View Calendar',
    );
  }
}
```

### Step 3.3: Use `FutureBuilder` inside the Mobile Page
Fetch and display the button dynamically based on values fetched from the service.

```dart
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class CalendarResourceWidget extends StatelessWidget {
  final CalendarService _calendarService = CalendarService();

  Future<void> _openPdf(BuildContext context, String url) async {
    final Uri uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open PDF file.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AppCalendarConfig>(
      future: _calendarService.fetchCalendarConfig(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Center(child: CircularProgressIndicator());
        }
        
        final config = snapshot.data ?? AppCalendarConfig(
          pdfUrl: '/Suvara Calender.pdf',
          buttonTitle: 'View Calendar',
        );

        return ElevatedButton.icon(
          icon: Icon(Icons.calendar_month),
          label: Text(config.buttonTitle), // Title configured in Admin Panel
          onPressed: () => _openPdf(context, config.pdfUrl), // File path configured in Admin Panel
          style: ElevatedButton.styleFrom(
            padding: EdgeInsets.symmetric(vertical: 14.0, horizontal: 20.0),
          ),
        );
      },
    );
  }
}
```
