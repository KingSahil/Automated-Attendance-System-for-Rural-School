import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, Modal } from 'react-native';
import { Text, Button, Card, FAB, List, Chip } from 'react-native-paper';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import QRScannerWeb from '../components/QRScannerWeb';

export default function AttendanceScreen() {
  const [location, setLocation] = useState(null);
  const [students, setStudents] = useState([
    { id: 1, name: 'John Doe', status: null, rollNumber: '001' },
    { id: 2, name: 'Jane Smith', status: null, rollNumber: '002' },
    { id: 3, name: 'Mike Johnson', status: null, rollNumber: '003' },
    { id: 4, name: 'Sarah Wilson', status: null, rollNumber: '004' },
  ]);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    getLocationPermission();
    getCameraPermission();
  }, []);

  const getLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for attendance tracking');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocation(location);
  };

  const getCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
  };

  const markAttendance = (studentId, status) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId ? { ...student, status } : student
    ));
  };

  const handleQRScan = (qrData) => {
    const student = students.find(s => s.id === qrData.id);
    if (student) {
      markAttendance(qrData.id, 'present');
      Alert.alert('Success', `${qrData.name} marked as present!`);
    } else {
      Alert.alert('Error', 'Student not found in current class list.');
    }
    setShowQRScanner(false);
  };

  const saveAttendance = () => {
    const attendanceData = {
      date: new Date().toISOString().split('T')[0],
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      } : null,
      students: students.map(student => ({
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        status: student.status
      }))
    };

    // Here you would typically save to a database
    console.log('Attendance Data:', attendanceData);
    Alert.alert('Success', 'Attendance saved successfully!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#4CAF50';
      case 'absent': return '#F44336';
      case 'late': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.cardTitle}>Today's Attendance</Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              Date: {new Date().toLocaleDateString()}
            </Text>
            {location && (
              <Text variant="bodySmall" style={styles.locationText}>
                Location: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.scannerSection}>
              <Text variant="titleMedium" style={styles.cardTitle}>Quick Scan</Text>
              <Button 
                mode="contained" 
                onPress={() => setShowQRScanner(true)}
                style={styles.scanButton}
                icon="qrcode-scan"
              >
                Scan Student QR Code
              </Button>
            </View>
          </Card.Content>
        </Card>

        {students.map((student) => (
          <Card key={student.id} style={styles.studentCard}>
            <Card.Content>
              <View style={styles.studentHeader}>
                <View>
                  <Text variant="titleMedium" style={styles.studentName}>{student.name}</Text>
                  <Text variant="bodySmall" style={styles.rollNumber}>Roll No: {student.rollNumber}</Text>
                </View>
                <Chip 
                  mode="outlined" 
                  style={[styles.statusChip, { borderColor: getStatusColor(student.status) }]}
                  textStyle={{ color: getStatusColor(student.status) }}
                >
                  {student.status || 'Not Marked'}
                </Chip>
              </View>
              
              <View style={styles.buttonRow}>
                <Button 
                  mode="contained" 
                  buttonColor="#4CAF50"
                  style={styles.attendanceButton}
                  onPress={() => markAttendance(student.id, 'present')}
                >
                  Present
                </Button>
                <Button 
                  mode="contained" 
                  buttonColor="#FF9800"
                  style={styles.attendanceButton}
                  onPress={() => markAttendance(student.id, 'late')}
                >
                  Late
                </Button>
                <Button 
                  mode="contained" 
                  buttonColor="#F44336"
                  style={styles.attendanceButton}
                  onPress={() => markAttendance(student.id, 'absent')}
                >
                  Absent
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <FAB
        icon="content-save"
        style={styles.fab}
        onPress={saveAttendance}
        label="Save Attendance"
        extended
      />

      <Modal
        visible={showQRScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <QRScannerWeb
          visible={showQRScanner}
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  studentCard: {
    marginBottom: 8,
    backgroundColor: '#1E1E1E',
  },
  cardTitle: {
    color: '#FFFFFF',
  },
  cardText: {
    color: '#CCCCCC',
  },
  studentName: {
    color: '#FFFFFF',
  },
  rollNumber: {
    color: '#CCCCCC',
  },
  scannerSection: {
    alignItems: 'center',
  },
  scanButton: {
    marginTop: 12,
    backgroundColor: '#90CAF9',
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusChip: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  attendanceButton: {
    flex: 1,
  },
  locationText: {
    marginTop: 4,
    color: '#AAAAAA',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#90CAF9',
  },
});
