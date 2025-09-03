# 🔧 QR Code Generation Troubleshooting Guide

## Common QR Code Generation Errors and Solutions

### 🚨 Error: "QR Code library failed to load"

**Symptoms:**
- Red error message saying QR library failed to load
- Generate button doesn't work
- No QR codes appear

**Solutions:**
1. **Check Internet Connection:**
   ```
   - Ensure you have a stable internet connection
   - The QR generator requires internet to load the QR library
   - Try refreshing the page
   ```

2. **Use Alternative Generator:**
   ```
   - Open `qr-generator-offline.html` instead
   - This version uses Google Charts API and works more reliably
   - No external JavaScript libraries required
   ```

3. **Browser Issues:**
   ```
   - Try a different browser (Chrome, Firefox, Edge, Safari)
   - Clear browser cache (Ctrl+Shift+Delete)
   - Disable ad blockers temporarily
   - Try incognito/private browsing mode
   ```

### 🌐 Error: "Network Error" or "Failed to fetch"

**Symptoms:**
- QR codes don't generate
- Browser console shows network errors
- Timeout messages

**Solutions:**
1. **Use Local Server:**
   ```
   - Run `start-server.bat` (Windows) or start a local HTTP server
   - Access via http://localhost:8000
   - This avoids CORS and file access issues
   ```

2. **Alternative Methods:**
   ```
   - Use the offline QR generator (`qr-generator-offline.html`)
   - Try opening files in a different browser
   - Check firewall/antivirus settings
   ```

### 📱 Error: QR Codes Don't Scan Properly

**Symptoms:**
- QR codes generate but scanner can't read them
- Scanner shows "Invalid QR code format"
- Attendance app doesn't recognize the student

**Solutions:**
1. **Check QR Code Format:**
   ```json
   // Correct JSON format:
   {
     "id": "123456",
     "name": "John Doe"
   }
   
   // Correct Simple format:
   123456
   ```

2. **Verify QR Code Quality:**
   ```
   - Use larger size (300x300 or 400x400 pixels)
   - Ensure high contrast (black on white)
   - Print at minimum 2cm x 2cm size
   - Avoid damaged or blurry prints
   ```

3. **Test with Scanner:**
   ```
   - Use `test-qr-codes.html` to test scanning
   - Verify the attendance scanner app is working
   - Check camera permissions and lighting
   ```

### 💾 Error: Download Not Working

**Symptoms:**
- Download button doesn't respond
- Files don't save to device
- Browser blocks downloads

**Solutions:**
1. **Browser Settings:**
   ```
   - Allow downloads in browser settings
   - Check download location permissions
   - Disable popup blockers for the site
   ```

2. **Alternative Download Methods:**
   ```
   - Right-click on QR code image → "Save image as"
   - Use browser's built-in screenshot tool
   - Copy image and paste into image editor
   ```

3. **Batch Download Issues:**
   ```
   - Downloads may be staggered to avoid browser blocking
   - Allow multiple downloads when prompted
   - Try downloading one at a time if batch fails
   ```

## 🛠️ Advanced Troubleshooting

### Method 1: Manual QR Code Generation

If automated generation fails, you can create QR codes manually:

1. **Online QR Generators:**
   - Visit qr-code-generator.com
   - Use qrcode.com
   - Try qr-monkey.com

2. **QR Code Data Format:**
   ```
   For JSON format, enter:
   {"id": "123456", "name": "John Doe"}
   
   For simple format, enter:
   123456
   ```

### Method 2: Using Mobile Apps

1. **Download QR Generator Apps:**
   - "QR Code Generator" (Android/iOS)
   - "QR Reader" with generation feature
   - "QR & Barcode Scanner"

2. **Generate and Share:**
   - Create QR codes on mobile
   - Email or share to computer
   - Print for student ID cards

### Method 3: Command Line Tools

For tech-savvy users:

1. **Install qrencode (Linux/Mac):**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install qrencode
   
   # Generate QR code
   qrencode -o student-123456.png '{"id": "123456", "name": "John Doe"}'
   ```

2. **Python Script:**
   ```python
   import qrcode
   import json
   
   # Student data
   student = {"id": "123456", "name": "John Doe"}
   data = json.dumps(student)
   
   # Generate QR code
   qr = qrcode.QRCode(version=1, box_size=10, border=5)
   qr.add_data(data)
   qr.make(fit=True)
   
   # Save image
   img = qr.make_image(fill_color="black", back_color="white")
   img.save("student-123456.png")
   ```

## 📋 Quick Checklist

Before reporting issues, verify:

- [ ] Internet connection is working
- [ ] Browser is up to date
- [ ] JavaScript is enabled
- [ ] Pop-up blockers are disabled
- [ ] Download permissions are allowed
- [ ] Tried different browser
- [ ] Tried local server setup
- [ ] Used alternative QR generator
- [ ] Tested QR codes with scanner app

## 🆘 Emergency Backup Methods

### Method 1: Google Charts API (Always Works)
```html
<!-- Direct URL method -->
<img src="https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=123456">
```

### Method 2: Text-to-QR Services
- Visit: `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=YOUR_TEXT_HERE`
- Replace `YOUR_TEXT_HERE` with student data
- Right-click and save image

### Method 3: Batch Processing
1. Create a spreadsheet with student data
2. Use Excel/Google Sheets QR code add-ins
3. Generate QR codes in bulk
4. Export as images

## 📞 Getting Additional Help

### Check Browser Console
1. Press F12 to open developer tools
2. Click "Console" tab
3. Look for error messages (red text)
4. Copy error messages for troubleshooting

### Common Error Messages:
- **"ReferenceError: QRCode is not defined"** → Library loading issue
- **"NetworkError"** → Internet connection problem
- **"CORS error"** → Use local server or different browser
- **"Permission denied"** → Check file/download permissions

### System Requirements
- **Modern Browser:** Chrome 61+, Firefox 60+, Safari 11+, Edge 79+
- **Internet Connection:** Required for initial library loading
- **JavaScript:** Must be enabled
- **Local Storage:** Available for settings

---

**💡 Pro Tip:** The offline QR generator (`qr-generator-offline.html`) is the most reliable option as it doesn't depend on external JavaScript libraries and uses Google's reliable Charts API.