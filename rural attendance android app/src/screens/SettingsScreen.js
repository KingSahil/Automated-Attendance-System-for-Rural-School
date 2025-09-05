import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, List, Switch, Button, TextInput, Divider } from 'react-native-paper';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    locationTracking: true,
    cameraAccess: true,
    notifications: true,
    autoSync: false,
    biometricAuth: false,
    darkMode: false,
  });

  const [schoolInfo, setSchoolInfo] = useState({
    schoolName: 'Rural Primary School',
    principalName: 'Dr. Smith Johnson',
    address: 'Village Center, Rural District',
    phone: '+1234567890',
    email: 'principal@ruralschool.edu',
  });

  const [isEditing, setIsEditing] = useState(false);

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveSchoolInfo = () => {
    // Here you would typically save to a database
    setIsEditing(false);
    Alert.alert('Success', 'School information updated successfully!');
  };

  const exportData = () => {
    Alert.alert(
      'Export Data',
      'This will export all attendance data to a CSV file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => console.log('Export data functionality') }
      ]
    );
  };

  const importData = () => {
    Alert.alert(
      'Import Data',
      'This will import student data from a CSV file. This may overwrite existing data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import', onPress: () => console.log('Import data functionality') }
      ]
    );
  };

  const resetApp = () => {
    Alert.alert(
      'Reset App',
      'This will delete all data and reset the app to default settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => console.log('Reset app functionality') 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* App Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: '#FFFFFF' }}>App Settings</Text>
            
            <List.Item
              title="Location Tracking"
              description="Track location for attendance verification"
              left={props => <List.Icon {...props} icon="map-marker" />}
              right={() => (
                <Switch
                  value={settings.locationTracking}
                  onValueChange={() => toggleSetting('locationTracking')}
                />
              )}
            />
            
            <List.Item
              title="Camera Access"
              description="Enable camera for photo verification"
              left={props => <List.Icon {...props} icon="camera" />}
              right={() => (
                <Switch
                  value={settings.cameraAccess}
                  onValueChange={() => toggleSetting('cameraAccess')}
                />
              )}
            />
            
            <List.Item
              title="Push Notifications"
              description="Receive attendance reminders"
              left={props => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={settings.notifications}
                  onValueChange={() => toggleSetting('notifications')}
                />
              )}
            />
            
            <List.Item
              title="Auto Sync"
              description="Automatically sync data when online"
              left={props => <List.Icon {...props} icon="sync" />}
              right={() => (
                <Switch
                  value={settings.autoSync}
                  onValueChange={() => toggleSetting('autoSync')}
                />
              )}
            />
            
            <List.Item
              title="Biometric Authentication"
              description="Use fingerprint or face unlock"
              left={props => <List.Icon {...props} icon="fingerprint" />}
              right={() => (
                <Switch
                  value={settings.biometricAuth}
                  onValueChange={() => toggleSetting('biometricAuth')}
                />
              )}
            />
            
            <List.Item
              title="Dark Mode"
              description="Use dark theme"
              left={props => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={settings.darkMode}
                  onValueChange={() => toggleSetting('darkMode')}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* School Information */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={{ color: '#FFFFFF' }}>School Information</Text>
              <Button 
                mode={isEditing ? "contained" : "outlined"}
                onPress={() => setIsEditing(!isEditing)}
                compact
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </View>

            <TextInput
              label="School Name"
              value={schoolInfo.schoolName}
              onChangeText={(text) => setSchoolInfo(prev => ({ ...prev, schoolName: text }))}
              disabled={!isEditing}
              style={styles.input}
            />
            
            <TextInput
              label="Principal Name"
              value={schoolInfo.principalName}
              onChangeText={(text) => setSchoolInfo(prev => ({ ...prev, principalName: text }))}
              disabled={!isEditing}
              style={styles.input}
            />
            
            <TextInput
              label="Address"
              value={schoolInfo.address}
              onChangeText={(text) => setSchoolInfo(prev => ({ ...prev, address: text }))}
              disabled={!isEditing}
              multiline
              style={styles.input}
            />
            
            <TextInput
              label="Phone"
              value={schoolInfo.phone}
              onChangeText={(text) => setSchoolInfo(prev => ({ ...prev, phone: text }))}
              disabled={!isEditing}
              keyboardType="phone-pad"
              style={styles.input}
            />
            
            <TextInput
              label="Email"
              value={schoolInfo.email}
              onChangeText={(text) => setSchoolInfo(prev => ({ ...prev, email: text }))}
              disabled={!isEditing}
              keyboardType="email-address"
              style={styles.input}
            />

            {isEditing && (
              <Button 
                mode="contained" 
                onPress={saveSchoolInfo}
                style={styles.saveButton}
              >
                Save Changes
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: '#FFFFFF' }}>Data Management</Text>
            
            <List.Item
              title="Export Data"
              description="Export attendance data to CSV"
              left={props => <List.Icon {...props} icon="export" />}
              onPress={exportData}
            />
            
            <List.Item
              title="Import Data"
              description="Import student data from CSV"
              left={props => <List.Icon {...props} icon="import" />}
              onPress={importData}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Reset App"
              description="Delete all data and reset settings"
              left={props => <List.Icon {...props} icon="delete-forever" color="#F44336" />}
              onPress={resetApp}
              titleStyle={{ color: '#F44336' }}
            />
          </Card.Content>
        </Card>

        {/* App Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: '#FFFFFF' }}>About</Text>
            
            <List.Item
              title="App Version"
              description="1.0.0"
              left={props => <List.Icon {...props} icon="information" />}
            />
            
            <List.Item
              title="Developer"
              description="Rural Education Solutions"
              left={props => <List.Icon {...props} icon="account-group" />}
            />
            
            <List.Item
              title="Support"
              description="Contact support team"
              left={props => <List.Icon {...props} icon="help-circle" />}
              onPress={() => console.log('Open support')}
            />
            
            <List.Item
              title="Privacy Policy"
              description="View privacy policy"
              left={props => <List.Icon {...props} icon="shield-account" />}
              onPress={() => console.log('Open privacy policy')}
            />
          </Card.Content>
        </Card>
      </ScrollView>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#2C2C2C',
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#90CAF9',
  },
  divider: {
    marginVertical: 8,
    backgroundColor: '#2C2C2C',
  },
});
