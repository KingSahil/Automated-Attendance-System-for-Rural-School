# Rural Attendance Scanner

A **QR-code based attendance scanner app** designed specifically for teachers in rural schools. This Progressive Web App (PWA) works completely **offline** and allows teachers to scan student QR codes from ID cards to mark attendance.

## 🌟 Features

- **📱 Mobile-First Design**: Optimized for smartphones and tablets
- **🔌 Completely Offline**: Works without internet connection
- **📷 QR Code Scanner**: Uses device camera to scan student ID QR codes
- **💾 Local Storage**: Saves attendance data directly on the device
- **📊 Multiple Export Formats**: Download attendance as CSV or JSON files
- **🎯 Easy to Use**: Simple, intuitive interface for teachers
- **⚡ Fast & Lightweight**: Minimal resource usage, perfect for older devices
- **📱 Installable**: Can be installed as a native app on mobile devices

## 🚀 Getting Started

### For Teachers (How to Use)

1. **Open the App**: Open `index.html` in any modern web browser
2. **Install (Optional)**: Add to home screen for easy access
3. **Setup**: Enter your name and class/subject in settings
4. **Start Scanning**: Tap "📷 Start Scanner" to begin
5. **Scan QR Codes**: Point camera at student ID QR codes
6. **Mark Attendance**: Students are automatically added to the list
7. **Download Data**: Use "💾 Download CSV" to save attendance files

### For IT Setup

1. **Download Files**: Copy all files to a web server or open locally
2. **No Installation Required**: Just open `index.html` in a browser
3. **HTTPS Recommended**: Camera access requires HTTPS on most devices
4. **Offline Ready**: Works without internet after initial load

## 📋 QR Code Format

The app supports two QR code formats:

### Simple Format (Student ID only):
```
123456
```

### JSON Format (Recommended):
```json
{
  "id": "123456",
  "name": "John Doe"
}
```

## 📱 Mobile Installation

### Android:
1. Open the app in Chrome
2. Tap "Add to Home Screen" when prompted
3. Or use Chrome menu → "Add to Home Screen"

### iOS:
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

## 💾 Data Storage

- **Local Storage**: All data is stored locally on the device
- **No Internet Required**: Everything works offline
- **Data Export**: Download CSV/JSON files to share or backup
- **Privacy**: No data is sent to external servers

## 📊 Attendance Reports

The app generates detailed attendance reports including:

- Student ID and Name
- Date and Time of attendance
- Teacher information
- Class/Subject details
- Total count of students

### CSV Format:
```csv
"Attendance Report"
"Teacher:","John Smith"
"Class/Subject:","Grade 5 - Mathematics"
"Date:","3/9/2025"
"Total Students:","25"
""
"Student ID","Student Name","Date","Time","Timestamp"
"123456","John Doe","Mon Sep 03 2025","10:30:45 AM","2025-09-03T10:30:45.123Z"
```

## 🔧 Technical Requirements

### Minimum Requirements:
- **Browser**: Chrome 61+, Safari 11+, Firefox 60+, Edge 79+
- **Device**: Any smartphone/tablet with camera
- **Storage**: 5MB available space
- **Camera**: Rear-facing camera recommended

### Recommended:
- **Android 7.0+** or **iOS 11+**
- **4GB RAM** or more
- **HTTPS connection** for camera access
- **Modern browser** with PWA support

## 📐 Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Camera Access | ✅ | ✅ | ✅ | ✅ |
| QR Scanning | ✅ | ✅ | ✅ | ✅ |
| Local Storage | ✅ | ✅ | ✅ | ✅ |
| File Download | ✅ | ✅ | ✅ | ✅ |
| PWA Install | ✅ | ✅ | ✅ | ✅ |
| Offline Mode | ✅ | ✅ | ✅ | ✅ |

## 🔒 Privacy & Security

- **No Data Collection**: No personal data is sent to external servers
- **Local Only**: All data remains on the device
- **Camera Permission**: Only used for QR code scanning
- **No Tracking**: No analytics or tracking scripts
- **Open Source**: All code is transparent and auditable

## 🛠️ Troubleshooting

### Camera Not Working:
1. **Check Permissions**: Ensure camera permission is granted
2. **Use HTTPS**: Camera requires secure connection
3. **Try Different Browser**: Some browsers have better camera support
4. **Restart Browser**: Close and reopen the browser
5. **Check Camera**: Ensure camera is working in other apps

### QR Codes Not Scanning:
1. **Better Lighting**: Ensure good lighting conditions
2. **Steady Hand**: Hold device steady while scanning
3. **Correct Distance**: Hold device 6-12 inches from QR code
4. **Clean Lens**: Clean camera lens for better clarity
5. **Valid QR Code**: Ensure QR code contains valid data

### App Not Installing:
1. **Modern Browser**: Use latest version of supported browser
2. **Storage Space**: Ensure device has available storage
3. **Manual Add**: Use browser menu to add to home screen
4. **Clear Cache**: Clear browser cache and try again

## 📁 File Structure

```
rural-attendance/
├── index.html          # Main app interface
├── styles.css          # App styling
├── app.js             # Main application logic
├── sw.js              # Service worker for offline functionality
├── manifest.json      # PWA manifest
├── icon-*.png         # App icons (various sizes)
└── README.md          # This documentation
```

## 🔄 Updates

The app automatically updates when connected to internet. For manual updates:

1. **Refresh Browser**: Pull down to refresh or use browser refresh
2. **Clear Cache**: Clear browser cache if needed
3. **Reinstall**: Remove and reinstall the app

## 📞 Support

For technical support or questions:

1. **Check Troubleshooting**: Review the troubleshooting section above
2. **Browser Console**: Check browser developer tools for error messages
3. **Device Compatibility**: Ensure device meets minimum requirements

## 📄 License

This project is open source and available for educational use in rural schools.

## 🙏 Acknowledgments

- **jsQR Library**: QR code scanning functionality
- **Rural Education Initiative**: For inspiring this project
- **Open Source Community**: For tools and resources

---

**Made with ❤️ for rural education**