# 🚀 Setup Guide - Rural Attendance Scanner

This guide will help you set up the Rural Attendance Scanner app for use in rural schools.

## 📋 Quick Start

### Option 1: Direct Browser Access (Simplest)
1. **Download/Copy Files**: Get all the app files to a folder
2. **Open in Browser**: Double-click `index.html` or open it in any modern browser
3. **Allow Camera**: Grant camera permission when prompted
4. **Start Scanning**: Tap "📷 Start Scanner" and begin scanning QR codes

**Note**: Camera access might be limited when opening files directly. Use Option 2 for full functionality.

### Option 2: Local HTTP Server (Recommended)

#### Windows:
1. **Install Python** (if not installed): Download from [python.org](https://python.org)
2. **Run Server**: Double-click `start-server.bat`
3. **Open Browser**: Go to `http://localhost:8000`
4. **Start Using**: The app will work with full camera access

#### macOS/Linux:
```bash
# Navigate to the app folder
cd /path/to/rural-attendance

# Start Python HTTP server
python3 -m http.server 8000

# Open browser and go to: http://localhost:8000
```

#### Alternative Servers:
```bash
# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000

# Using Ruby
ruby -run -e httpd . -p 8000
```

## 📱 Mobile Installation

### Android Devices:
1. **Open in Chrome**: Navigate to the app URL
2. **Install Prompt**: Tap "Add to Home Screen" when prompted
3. **Manual Install**: Chrome Menu → "Add to Home Screen"
4. **Use as App**: Launch from home screen like a native app

### iOS Devices:
1. **Open in Safari**: Navigate to the app URL
2. **Share Menu**: Tap the Share button (square with arrow)
3. **Add to Home Screen**: Select "Add to Home Screen"
4. **Confirm**: Tap "Add" to install the app

### Alternative Browsers:
- **Firefox**: Menu → "Install" (if available)
- **Edge**: Menu → "Apps" → "Install this site as an app"

## 🏫 School Network Deployment

### Option A: Local Network Server
1. **Set up a local server** on one computer
2. **Connect devices to WiFi** (no internet required)
3. **Access via IP address**: e.g., `http://192.168.1.100:8000`
4. **Install on all devices** for offline use

### Option B: Shared Folder Access
1. **Copy files to shared network folder**
2. **Access from any device** on the network
3. **Open `index.html`** from the network location

### Option C: USB Distribution
1. **Copy app folder to USB drives**
2. **Distribute to teachers**
3. **Copy to device storage** for offline access

## 🔧 Troubleshooting

### Camera Issues:
| Problem | Solution |
|---------|----------|
| Camera not working | Use HTTPS or localhost server |
| Permission denied | Check browser camera settings |
| Black screen | Try different browser or restart |
| Poor scanning | Ensure good lighting, clean lens |

### App Installation Issues:
| Problem | Solution |
|---------|----------|
| No install prompt | Use supported browser (Chrome, Safari, Edge) |
| Install fails | Clear browser cache, try again |
| App won't open | Check storage space, reinstall |

### Performance Issues:
| Problem | Solution |
|---------|----------|
| Slow scanning | Close other apps, restart browser |
| App crashes | Update browser, clear cache |
| Storage full | Clear old attendance data |

## 📊 QR Code Setup

### Creating Student QR Codes:
1. **Use QR Generator**: Open `qr-generator.html`
2. **Choose Format**: JSON (recommended) or Simple ID
3. **Enter Student Data**: ID and name for each student
4. **Generate & Print**: Create QR codes for ID cards

### QR Code Formats:
```json
// JSON Format (Recommended)
{
  "id": "123456",
  "name": "John Doe"
}

// Simple Format
123456
```

### Printing QR Codes:
1. **Size**: Minimum 2cm x 2cm for reliable scanning
2. **Quality**: High contrast (black on white)
3. **Material**: Laminate for durability
4. **Placement**: Visible area of ID card

## 🔒 Security & Privacy

### Data Storage:
- **Local Only**: All data stays on the device
- **No Internet**: No data sent to external servers
- **Offline**: Works completely without internet
- **Privacy**: No tracking or analytics

### Best Practices:
1. **Regular Backups**: Download attendance data regularly
2. **Device Security**: Use device lock screens
3. **Access Control**: Limit app access to authorized teachers
4. **Data Cleanup**: Clear old data periodically

## 📱 Device Requirements

### Minimum Requirements:
- **Android 7.0+** or **iOS 11+**
- **2GB RAM** minimum
- **Camera** with autofocus
- **5MB** storage space
- **Modern browser** (Chrome 61+, Safari 11+, Firefox 60+)

### Recommended Specifications:
- **Android 9.0+** or **iOS 13+**
- **4GB RAM** or more
- **Good camera** with flash
- **WiFi capability** for initial setup
- **Recent browser** version

## 🆘 Support & Help

### Getting Help:
1. **Check README**: Review the main documentation
2. **Test Page**: Use `test-qr-codes.html` for testing
3. **Browser Console**: Check for error messages (F12)
4. **Try Different Browser**: Some browsers work better than others

### Common Solutions:
1. **Clear Browser Cache**: Ctrl+Shift+Delete
2. **Restart Browser**: Close and reopen
3. **Update Browser**: Get the latest version
4. **Check Permissions**: Camera and storage access
5. **Try Incognito**: Test in private/incognito mode

### Technical Support:
- **Documentation**: Check all .md files in the app folder
- **Browser Tools**: Use developer tools for debugging
- **Test Environment**: Use provided test files

## 📁 File Structure

```
rural-attendance/
├── index.html              # Main attendance scanner app
├── styles.css              # App styling and design
├── app.js                  # Main application logic
├── sw.js                   # Service worker (offline support)
├── manifest.json           # PWA configuration
├── qr-generator.html       # QR code generator tool
├── test-qr-codes.html      # Testing QR codes
├── start-server.bat        # Windows server starter
├── README.md               # Main documentation
├── SETUP_GUIDE.md          # This setup guide
└── icon-template.svg       # App icon template
```

## 🔄 Updates & Maintenance

### Updating the App:
1. **Download New Version**: Get latest files
2. **Replace Old Files**: Backup data first
3. **Clear Cache**: Force browser refresh
4. **Test Functionality**: Ensure everything works

### Maintenance Tasks:
- **Weekly**: Download attendance data backups
- **Monthly**: Clear old cached data
- **Quarterly**: Update browser and app if needed
- **Yearly**: Review and update student QR codes

---

**✅ Setup Complete!**

Once you've followed these steps, your Rural Attendance Scanner should be ready for use. Teachers can now scan student QR codes to mark attendance, even in areas without internet connectivity.

**Need Help?** Refer to the troubleshooting section above or check the main README.md file for additional information.