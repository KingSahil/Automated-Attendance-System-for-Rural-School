import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { Button, Text, Card, IconButton } from 'react-native-paper';

const { width } = Dimensions.get('window');

export default function QRScanner({ onScan, onClose, visible }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    try {
      const studentData = JSON.parse(data);
      if (studentData.type === 'student_qr' && studentData.id) {
        onScan(studentData);
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not a valid student code.');
      }
    } catch (error) {
      Alert.alert('Invalid QR Code', 'Could not read student information from this QR code.');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={{ color: '#FFFFFF' }}>Requesting camera permission...</Text>
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
            <Text style={{ color: '#FFFFFF' }}>No access to camera</Text>
            <Button mode="contained" onPress={onClose} style={styles.button}>
              Close
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (!visible) {
    return null;
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

      <Camera
        style={styles.scanner}
        type={Camera.Constants.Type.back}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: [Camera.Constants.BarCodeType.qr],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.scanText}>
          Position the QR code within the frame
        </Text>
      </View>

      {scanned && (
        <View style={styles.rescanContainer}>
          <Button
            mode="contained"
            onPress={() => setScanned(false)}
            style={styles.rescanButton}
          >
            Tap to Scan Again
          </Button>
        </View>
      )}
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
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  rescanContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  rescanButton: {
    backgroundColor: '#90CAF9',
  },
  card: {
    margin: 20,
    backgroundColor: '#1E1E1E',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#90CAF9',
  },
});
