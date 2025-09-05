import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import AttendanceScreen from './src/screens/AttendanceScreen';
import StudentsScreen from './src/screens/StudentsScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Custom dark theme
const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90CAF9',
    primaryContainer: '#1976D2',
    secondary: '#81C784',
    secondaryContainer: '#388E3C',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    background: '#121212',
    error: '#CF6679',
    errorContainer: '#B00020',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onSurface: '#FFFFFF',
    onBackground: '#FFFFFF',
    outline: '#73777F',
  },
};

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#90CAF9',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#2C2C2C',
  },
};

export default function App() {
  return (
    <PaperProvider theme={customDarkTheme}>
      <NavigationContainer theme={navigationTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Attendance') {
                iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
              } else if (route.name === 'Students') {
                iconName = focused ? 'people' : 'people-outline';
              } else if (route.name === 'Reports') {
                iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'settings' : 'settings-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#90CAF9',
            tabBarInactiveTintColor: '#73777F',
            tabBarStyle: {
              backgroundColor: '#1E1E1E',
              borderTopColor: '#2C2C2C',
            },
            headerStyle: {
              backgroundColor: '#1E1E1E',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          })}
        >
          <Tab.Screen name="Attendance" component={AttendanceScreen} />
          <Tab.Screen name="Students" component={StudentsScreen} />
          <Tab.Screen name="Reports" component={ReportsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </PaperProvider>
  );
}
