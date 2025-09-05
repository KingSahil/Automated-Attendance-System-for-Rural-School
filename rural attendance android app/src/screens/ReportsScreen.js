import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Button, SegmentedButtons, DataTable } from 'react-native-paper';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock data for demonstration
  const attendanceData = {
    daily: [
      { date: '2025-09-05', present: 3, absent: 1, late: 0, total: 4 },
      { date: '2025-09-04', present: 4, absent: 0, late: 0, total: 4 },
      { date: '2025-09-03', present: 2, absent: 1, late: 1, total: 4 },
      { date: '2025-09-02', present: 3, absent: 1, late: 0, total: 4 },
    ],
    weekly: [
      { week: 'Week 1 (Sep 1-7)', present: 85, absent: 10, late: 5, total: 100 },
      { week: 'Week 2 (Aug 25-31)', present: 90, absent: 8, late: 2, total: 100 },
      { week: 'Week 3 (Aug 18-24)', present: 88, absent: 7, late: 5, total: 100 },
    ],
    monthly: [
      { month: 'September 2025', present: 85, absent: 10, late: 5, total: 100 },
      { month: 'August 2025', present: 88, absent: 8, late: 4, total: 100 },
      { month: 'July 2025', present: 92, absent: 5, late: 3, total: 100 },
    ]
  };

  const studentStats = [
    { name: 'John Doe', rollNumber: '001', present: 18, absent: 2, late: 0, percentage: 90 },
    { name: 'Jane Smith', rollNumber: '002', present: 20, absent: 0, late: 0, percentage: 100 },
    { name: 'Mike Johnson', rollNumber: '003', present: 17, absent: 2, late: 1, percentage: 85 },
    { name: 'Sarah Wilson', rollNumber: '004', present: 19, absent: 1, late: 0, percentage: 95 },
  ];

  const getAttendancePercentage = (present, total) => {
    return total > 0 ? ((present / total) * 100).toFixed(1) : 0;
  };

  const exportReport = () => {
    // This would typically generate and export a PDF or CSV file
    console.log('Export functionality would be implemented here');
  };

  const renderDashboard = () => {
    const todayData = attendanceData.daily[0];
    const overallStats = studentStats.reduce((acc, student) => ({
      present: acc.present + student.present,
      absent: acc.absent + student.absent,
      late: acc.late + student.late
    }), { present: 0, absent: 0, late: 0 });

    return (
      <View>
        <Card style={styles.dashboardCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: '#FFFFFF' }}>Today's Summary</Text>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryItem, { backgroundColor: '#1B5E20' }]}>
                <Text variant="headlineMedium" style={{ color: '#4CAF50' }}>
                  {todayData.present}
                </Text>
                <Text variant="bodySmall" style={{ color: '#FFFFFF' }}>Present</Text>
              </View>
              <View style={[styles.summaryItem, { backgroundColor: '#E65100' }]}>
                <Text variant="headlineMedium" style={{ color: '#FF9800' }}>
                  {todayData.late}
                </Text>
                <Text variant="bodySmall" style={{ color: '#FFFFFF' }}>Late</Text>
              </View>
              <View style={[styles.summaryItem, { backgroundColor: '#B71C1C' }]}>
                <Text variant="headlineMedium" style={{ color: '#F44336' }}>
                  {todayData.absent}
                </Text>
                <Text variant="bodySmall" style={{ color: '#FFFFFF' }}>Absent</Text>
              </View>
            </View>
            <Text variant="bodyMedium" style={styles.percentageText}>
              Attendance Rate: {getAttendancePercentage(todayData.present, todayData.total)}%
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: '#FFFFFF' }}>Student Performance</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Student</DataTable.Title>
                <DataTable.Title numeric>Present</DataTable.Title>
                <DataTable.Title numeric>Absent</DataTable.Title>
                <DataTable.Title numeric>%</DataTable.Title>
              </DataTable.Header>

              {studentStats.map((student) => (
                <DataTable.Row key={student.rollNumber}>
                  <DataTable.Cell>
                    <View>
                      <Text variant="bodyMedium" style={{ color: '#FFFFFF' }}>{student.name}</Text>
                      <Text variant="bodySmall" style={{ color: '#CCCCCC' }}>{student.rollNumber}</Text>
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>{student.present}</DataTable.Cell>
                  <DataTable.Cell numeric>{student.absent}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text style={{ 
                      color: student.percentage >= 90 ? '#4CAF50' : 
                             student.percentage >= 75 ? '#FF9800' : '#F44336' 
                    }}>
                      {student.percentage}%
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderReports = () => {
    const data = attendanceData[reportType];
    
    return (
      <View>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: '#FFFFFF' }}>Attendance Reports</Text>
            
            <SegmentedButtons
              value={reportType}
              onValueChange={setReportType}
              buttons={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
              style={styles.segmentedButtons}
            />

            <DataTable>
              <DataTable.Header>
                <DataTable.Title>
                  {reportType === 'daily' ? 'Date' : 
                   reportType === 'weekly' ? 'Week' : 'Month'}
                </DataTable.Title>
                <DataTable.Title numeric>Present</DataTable.Title>
                <DataTable.Title numeric>Absent</DataTable.Title>
                <DataTable.Title numeric>Late</DataTable.Title>
                <DataTable.Title numeric>%</DataTable.Title>
              </DataTable.Header>

              {data.map((row, index) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell>
                    {row.date || row.week || row.month}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>{row.present}</DataTable.Cell>
                  <DataTable.Cell numeric>{row.absent}</DataTable.Cell>
                  <DataTable.Cell numeric>{row.late}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    {getAttendancePercentage(row.present, row.total)}%
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>

            <Button 
              mode="contained" 
              onPress={exportReport}
              style={styles.exportButton}
              icon="download"
            >
              Export Report
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {renderDashboard()}
        {renderReports()}
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
  dashboardCard: {
    marginBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  percentageText: {
    textAlign: 'center',
    marginTop: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  segmentedButtons: {
    marginVertical: 16,
  },
  exportButton: {
    marginTop: 16,
    backgroundColor: '#90CAF9',
  },
});
