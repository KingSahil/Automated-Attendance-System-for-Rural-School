# Firebase Setup Guide for Rural Attendance Scanner

## Quick Fix for Current Error

The "Missing or insufficient permissions" error means your Firestore security rules are blocking access. Here's how to fix it:

### Step 1: Update Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `rural-attendance` project
3. Navigate to **Firestore Database** → **Rules**
4. Replace the existing rules with the content from `firestore.rules` file
5. Click **Publish** to apply the changes

### Step 2: Configure App Settings

1. Open the Rural Attendance Scanner app
2. Go to **Settings** tab
3. Fill in:
   - **School Name**: Enter your school name (required for cloud sync)
   - **Teacher Name**: Enter your name (required for cloud sync)
   - **Class/Subject**: Enter your class/subject (optional)

### Step 3: Test Cloud Sync

1. Go to **Settings** tab
2. Click **☁️ Sync to Cloud** button
3. You should see a success message

## Complete Firebase Setup (For New Projects)

### 1. Create Firebase Project

1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Enter project name: `rural-attendance-[your-school]`
4. Enable Google Analytics (optional)
5. Create project

### 2. Enable Firestore Database

1. In your Firebase project, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location closest to your region
5. Click **Done**

### 3. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click **Web app** icon (</>)
4. Register app name: `Rural Attendance Scanner`
5. Copy the Firebase config object

### 4. Update App Configuration

Open `app.js` and replace the `firebaseConfig` object (around line 11) with your config:

```javascript
this.firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-actual-app-id"
};
```

### 5. Configure Security Rules

1. In Firestore Database, go to **Rules**
2. Copy content from `firestore.rules` file
3. Paste and **Publish**

## Security Considerations

### Development Mode (Current Setup)
- Open read/write access for testing
- Suitable for development and small deployments
- **Warning**: Anyone with your database URL can read/write data

### Production Recommendations

1. **Enable Firebase Authentication**
   ```javascript
   // Add to your Firebase config
   // Then users must sign in before syncing
   ```

2. **Implement School-based Access Control**
   - Each school gets isolated data
   - Teachers can only access their school's data

3. **Add Time-based Restrictions**
   - Only allow uploads during school hours
   - Prevent after-hours data manipulation

4. **Enable Audit Logging**
   - Track who uploaded what data
   - Monitor for suspicious activity

## Troubleshooting

### Permission Denied Error
- Check Firestore rules are published
- Verify school and teacher name are set in Settings
- Try the manual sync button in Settings

### Network Connection Issues
- App works offline and syncs when online
- Check internet connection
- Firebase may be blocked by school firewalls

### Data Not Appearing
- Each school gets separate data storage
- Verify school name is spelled consistently
- Use Analytics tab to view historical data

## Data Structure

Your attendance data is stored as:
```
schools/
  └── your-school-name/
      └── attendance/
          └── [auto-generated-id]/
              ├── studentId: "123456"
              ├── studentName: "John Doe"
              ├── timestamp: "2024-01-15T10:30:00Z"
              ├── teacherName: "Ms. Smith"
              ├── schoolName: "Your School"
              └── deviceId: "device_abc123"
```

## Support

If you continue having issues:
1. Check browser console for detailed error messages
2. Verify all settings are configured in the app
3. Test with a simple school name (no special characters)
4. Try using the app in an incognito/private browser window