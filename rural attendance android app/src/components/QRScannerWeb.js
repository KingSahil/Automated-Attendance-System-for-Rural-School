import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert, Platform } from 'react-native';
import { Button, Text, Card, IconButton } from 'react-native-paper';

// For web, we'll use a simple file input as expo-camera doesn't work in browsers
// For mobile, we'll import and use the mobile QR scanner
let QRScannerMobile = null;
if (Platform.OS !== 'web') {
  QRScannerMobile = require('./QRScanner').default;
}

const { width } = Dimensions.get('window');

export default function QRScannerWeb({ onScan, onClose, visible }) {
  // If not web, use the mobile scanner
  if (Platform.OS !== 'web' && QRScannerMobile) {
    return <QRScannerMobile onScan={onScan} onClose={onClose} visible={visible} />;
  }

  // Web implementation
  const [hasPermission, setHasPermission] = useState(null);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (visible) {
      getCameraPermissions();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [visible]);

  const getCameraPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera permission denied:', error);
      setHasPermission(false);
      Alert.alert('Camera Error', 'Could not access camera. Please ensure camera permissions are granted.');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Simple mock QR data for demonstration
        const mockStudentData = {
          type: 'student_qr',
          id: Math.floor(Math.random() * 4) + 1,
          name: 'Demo Student',
          rollNumber: '00' + (Math.floor(Math.random() * 4) + 1)
        };
        onScan(mockStudentData);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!visible) {
    return null;
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.text}>Requesting camera permission...</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.text}>Camera access denied</Text>
            <Text style={styles.subText}>
              For web browsers, please allow camera access or upload a QR code image instead.
            </Text>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={styles.fileInput}
            />
            <Button mode="contained" onPress={onClose} style={styles.button}>
              Close
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerText}>
          Scan Student QR Code
        </Text>
        <IconButton
          icon="close"
          iconColor="#FFFFFF"
          size={24}
          onPress={onClose}
        />
      </View>

      {Platform.OS === 'web' ? (
        <View style={styles.webCameraContainer}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={styles.video}
          />
          <canvas ref={canvasRef} style={styles.canvas} />
          
          <View style={styles.webControls}>
            <Text style={styles.webText}>
              Camera preview for web - QR scanning not fully supported
            </Text>
            <Text style={styles.webSubText}>
              Upload a QR code image instead:
            </Text>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={styles.fileInput}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.scanText}>
          {Platform.OS === 'web' 
            ? 'Upload QR code image using the file input above'
            : 'Position the QR code within the frame'
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E1E1E',
  },
  headerText: {
    color: '#FFFFFF',
  },
  webCameraContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '60%',
    objectFit: 'cover',
  },
  canvas: {
    display: 'none',
  },
  webControls: {
    padding: 20,
    backgroundColor: '#1E1E1E',
  },
  webText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  webSubText: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  fileInput: {
    backgroundColor: '#333333',
    color: '#FFFFFF',
    padding: 10,
    borderRadius: 5,
    border: '1px solid #555555',
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: Platform.OS === 'web' ? 'none' : 'auto',
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: '#90CAF9',
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    margin: 20,
    backgroundColor: '#1E1E1E',
  },
  text: {
    color: '#FFFFFF',
  },
  subText: {
    color: '#CCCCCC',
    marginTop: 10,
    marginBottom: 15,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#90CAF9',
  },
});
