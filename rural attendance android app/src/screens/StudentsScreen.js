import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { Text, Card, FAB, List, Searchbar, IconButton, Button } from 'react-native-paper';
import QRGenerator from '../components/QRGenerator';

export default function StudentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [students, setStudents] = useState([
    { 
      id: 1, 
      name: 'John Doe', 
      rollNumber: '001', 
      class: '10th Grade',
      phone: '+1234567890',
      address: 'Rural Village A',
      guardianName: 'Robert Doe'
    },
    { 
      id: 2, 
      name: 'Jane Smith', 
      rollNumber: '002', 
      class: '10th Grade',
      phone: '+1234567891',
      address: 'Rural Village B',
      guardianName: 'Mary Smith'
    },
    { 
      id: 3, 
      name: 'Mike Johnson', 
      rollNumber: '003', 
      class: '9th Grade',
      phone: '+1234567892',
      address: 'Rural Village A',
      guardianName: 'David Johnson'
    },
    { 
      id: 4, 
      name: 'Sarah Wilson', 
      rollNumber: '004', 
      class: '9th Grade',
      phone: '+1234567893',
      address: 'Rural Village C',
      guardianName: 'Linda Wilson'
    },
  ]);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber.includes(searchQuery) ||
    student.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addStudent = () => {
    Alert.alert(
      'Add Student',
      'This feature will open a form to add new students.',
      [{ text: 'OK' }]
    );
  };

  const editStudent = (studentId) => {
    Alert.alert(
      'Edit Student',
      `This feature will open an edit form for student ID: ${studentId}`,
      [{ text: 'OK' }]
    );
  };

  const deleteStudent = (studentId) => {
    Alert.alert(
      'Delete Student',
      'Are you sure you want to delete this student?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setStudents(prev => prev.filter(student => student.id !== studentId))
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search students..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        inputStyle={styles.searchInput}
        iconColor="#90CAF9"
      />

      <ScrollView>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryHeader}>
              <Text variant="headlineSmall" style={styles.cardTitle}>Student Summary</Text>
              <Button 
                mode="outlined" 
                onPress={() => setShowQRGenerator(true)}
                style={styles.qrButton}
                icon="qrcode"
              >
                Generate QR Codes
              </Button>
            </View>
            <Text variant="bodyMedium" style={styles.cardText}>Total Students: {students.length}</Text>
            <Text variant="bodyMedium" style={styles.cardText}>10th Grade: {students.filter(s => s.class === '10th Grade').length}</Text>
            <Text variant="bodyMedium" style={styles.cardText}>9th Grade: {students.filter(s => s.class === '9th Grade').length}</Text>
          </Card.Content>
        </Card>

        {filteredStudents.map((student) => (
          <Card key={student.id} style={styles.studentCard}>
            <Card.Content>
              <View style={styles.studentHeader}>
                <View style={styles.studentInfo}>
                  <Text variant="titleMedium" style={styles.studentName}>{student.name}</Text>
                  <Text variant="bodyMedium" style={styles.rollNumber}>Roll No: {student.rollNumber}</Text>
                  <Text variant="bodySmall" style={styles.classText}>Class: {student.class}</Text>
                </View>
                <View style={styles.actions}>
                  <IconButton 
                    icon="pencil" 
                    size={20}
                    iconColor="#90CAF9"
                    onPress={() => editStudent(student.id)}
                  />
                  <IconButton 
                    icon="delete" 
                    size={20}
                    iconColor="#F44336"
                    onPress={() => deleteStudent(student.id)}
                  />
                </View>
              </View>

              <List.Section style={styles.detailsList}>
                <List.Item
                  title="Guardian"
                  description={student.guardianName}
                  left={props => <List.Icon {...props} icon="account" color="#90CAF9" />}
                  titleStyle={styles.listTitle}
                  descriptionStyle={styles.listDescription}
                />
                <List.Item
                  title="Phone"
                  description={student.phone}
                  left={props => <List.Icon {...props} icon="phone" color="#90CAF9" />}
                  titleStyle={styles.listTitle}
                  descriptionStyle={styles.listDescription}
                />
                <List.Item
                  title="Address"
                  description={student.address}
                  left={props => <List.Icon {...props} icon="map-marker" color="#90CAF9" />}
                  titleStyle={styles.listTitle}
                  descriptionStyle={styles.listDescription}
                />
              </List.Section>
            </Card.Content>
          </Card>
        ))}

        {filteredStudents.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No students found
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Try adjusting your search or add a new student
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={addStudent}
        label="Add Student"
        extended
      />

      <Modal
        visible={showQRGenerator}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <QRGenerator
          students={students}
          visible={showQRGenerator}
          onClose={() => setShowQRGenerator(false)}
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
  searchbar: {
    marginBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  searchInput: {
    color: '#FFFFFF',
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrButton: {
    borderColor: '#90CAF9',
  },
  studentCard: {
    marginBottom: 12,
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
  classText: {
    color: '#AAAAAA',
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentInfo: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  detailsList: {
    marginTop: 8,
  },
  listTitle: {
    color: '#FFFFFF',
  },
  listDescription: {
    color: '#CCCCCC',
  },
  emptyCard: {
    marginTop: 32,
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  emptySubtext: {
    textAlign: 'center',
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
