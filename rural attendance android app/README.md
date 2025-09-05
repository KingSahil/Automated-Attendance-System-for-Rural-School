# Rural Attendance App

A cross-platform mobile application built with React Native and Expo for tracking student attendance in rural schools. This app provides an intuitive interface for teachers to mark attendance, manage student information, generate reports, and configure app settings.

## Features

### 📋 Attendance Tracking
- Mark students as Present, Absent, or Late
- Location-based attendance verification
- Camera integration for photo verification
- Real-time attendance status updates
- Save attendance data with date and location stamps

### 👥 Student Management
- Complete student database with personal information
- Search functionality for easy student lookup
- Add, edit, and delete student records
- Guardian contact information management
- Class-wise organization

### 📊 Reports & Analytics
- Daily, weekly, and monthly attendance reports
- Student performance analytics
- Attendance percentage calculations
- Visual dashboards with summary statistics
- Export functionality for reports

### ⚙️ Settings & Configuration
- Location tracking toggle
- Camera access permissions
- Push notification settings
- Auto-sync capabilities
- School information management
- Data import/export functionality

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **UI Components**: React Native Paper
- **Location Services**: Expo Location
- **Camera**: Expo Camera
- **Database**: Expo SQLite
- **File System**: Expo File System

## Prerequisites

Before running this application, make sure you have:

- [Node.js](https://nodejs.org/) (version 16 or higher)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Android Studio](https://developer.android.com/studio) (for Android development)
- Android emulator or physical Android device

## Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the App

### Development Mode
Start the Expo development server:
```bash
npm start
```

### Android Development
Run on Android emulator or device:
```bash
npm run android
```

### Web Development (for testing)
Run in web browser:
```bash
npm run web
```

## Project Structure

```
rural-attendance-app/
├── src/
│   └── screens/
│       ├── AttendanceScreen.js    # Main attendance marking interface
│       ├── StudentsScreen.js      # Student management
│       ├── ReportsScreen.js       # Analytics and reports
│       └── SettingsScreen.js      # App configuration
├── assets/                        # App icons and images
├── App.js                         # Main app component with navigation
├── app.json                       # Expo configuration
├── package.json                   # Dependencies and scripts
└── babel.config.js               # Babel configuration
```

## Key Components

### AttendanceScreen
- Location tracking for attendance verification
- Camera permissions for photo verification
- Student attendance marking interface
- Save attendance with location data

### StudentsScreen
- Complete student database management
- Search and filter functionality
- Add/edit/delete student records
- Guardian information management

### ReportsScreen
- Attendance analytics and visualizations
- Daily, weekly, and monthly reports
- Student performance tracking
- Export functionality

### SettingsScreen
- App configuration options
- School information management
- Data import/export features
- Privacy and security settings

## Permissions Required

This app requires the following permissions:

- **Location Access**: For attendance location verification
- **Camera Access**: For photo verification features
- **Storage Access**: For data export/import functionality

## Data Storage

The app uses Expo SQLite for local data storage, ensuring:
- Offline functionality
- Fast data access
- Data persistence across app sessions
- Easy data export capabilities

## Deployment

### Android APK Build
To build an APK for production:

1. Install Expo CLI globally:
   ```bash
   npm install -g @expo/cli
   ```

2. Build the app:
   ```bash
   expo build:android
   ```

### Google Play Store
For Play Store deployment, follow Expo's [deployment guide](https://docs.expo.dev/distribution/uploading-apps/).

## Customization

### School Branding
- Replace icons in the `assets/` directory
- Update school information in SettingsScreen
- Modify color scheme in individual screen styles

### Features Extension
- Add biometric authentication
- Implement cloud sync functionality
- Add parent notification features
- Include academic performance tracking

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `expo start -c`
2. **Permission errors**: Ensure all required permissions are granted
3. **Build failures**: Check Expo CLI version and update if needed

### Development Tips

- Use Expo Go app for quick testing
- Enable Debug JS Remotely for debugging
- Use React Native Debugger for advanced debugging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions:
- Check the [Expo documentation](https://docs.expo.dev/)
- Review [React Native Paper components](https://reactnativepaper.com/)
- Consult [React Navigation guides](https://reactnavigation.org/)

## License

This project is open source and available under the [MIT License](LICENSE).

## Version History

- **v1.0.0** - Initial release with core attendance tracking features
  - Student management
  - Attendance marking
  - Basic reporting
  - Settings configuration

---

Built with ❤️ for rural education communities.
