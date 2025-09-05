import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Divider } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function QRGenerator({ students, visible, onClose }) {
  if (!visible) {
    return null;
  }

  const generateQRData = (student) => {
    return JSON.stringify({
      type: 'student_qr',
      id: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      class: student.class,
      timestamp: Date.now()
    });
  };

  const generatePDF = async () => {
    try {
      const qrCodesHTML = await Promise.all(students.map(async (student) => `
        <div style="page-break-inside: avoid; margin: 20px; padding: 20px; border: 1px solid #ccc; display: inline-block; width: 300px; text-align: center;">
          <h3>${student.name}</h3>
          <p>Roll No: ${student.rollNumber}</p>
          <p>Class: ${student.class}</p>
          <div style="margin: 20px 0;">
            <div style="width: 150px; height: 150px; border: 2px solid #000; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
              QR Code for ${student.rollNumber}
            </div>
          </div>
          <p style="font-size: 12px; color: #666;">Scan to mark attendance</p>
        </div>
      `));

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Student QR Codes</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .qr-grid { display: flex; flex-wrap: wrap; justify-content: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student QR Codes</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="qr-grid">
            ${qrCodesHTML.join('')}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'QR codes generated successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF: ' + error.message);
    }
  };

  const getQRCodeBase64 = (student) => {
    return new Promise((resolve) => {
      // This would need to be implemented with a proper QR code to base64 converter
      // For now, we'll use a placeholder
      resolve('');
    });
  };

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="headlineSmall">QR Code Generator</Text>
            <Button mode="outlined" onPress={onClose}>
              Close
            </Button>
          </View>
          <Text variant="bodyMedium">
            Generate QR codes for all students to enable quick attendance scanning.
          </Text>
        </Card.Content>
      </Card>

      <ScrollView style={styles.scrollView}>
        {students.map((student) => (
          <Card key={student.id} style={styles.studentCard}>
            <Card.Content>
              <View style={styles.studentInfo}>
                <View style={styles.textInfo}>
                  <Text variant="titleMedium">{student.name}</Text>
                  <Text variant="bodyMedium">Roll No: {student.rollNumber}</Text>
                  <Text variant="bodySmall">Class: {student.class}</Text>
                </View>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={generateQRData(student)}
                    size={80}
                    color="#FFFFFF"
                    backgroundColor="#1E1E1E"
                  />
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={generatePDF}
          style={styles.generateButton}
          icon="download"
        >
          Generate PDF with All QR Codes
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerCard: {
    margin: 16,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  studentCard: {
    marginBottom: 12,
    backgroundColor: '#1E1E1E',
  },
  studentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textInfo: {
    flex: 1,
  },
  qrContainer: {
    marginLeft: 16,
  },
  footer: {
    padding: 16,
  },
  generateButton: {
    backgroundColor: '#90CAF9',
  },
});
