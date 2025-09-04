class AttendanceScanner {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.context = this.canvas.getContext('2d');
        this.isScanning = false;
        this.stream = null;
        this.attendanceData = [];
        this.scanCount = 0;
        this.selectedDate = new Date().toISOString().split('T')[0]; // Always use current date
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabNavigation();
        this.loadSettings();
        this.loadAttendanceData();
        this.updateUI();
        this.updateDateTime();
        this.initializeDatePickers();
        
        // Update date every minute
        setInterval(() => this.updateDateTime(), 60000);
        
        // Hide loading screen
        this.hideLoading();
    }

    setupEventListeners() {
        // Scanner controls
        document.getElementById('start-scan').addEventListener('click', () => this.startScanning());
        document.getElementById('stop-scan').addEventListener('click', () => this.stopScanning());
        
        // Download buttons
        document.getElementById('download-csv').addEventListener('click', () => this.downloadCSV());
        document.getElementById('download-json').addEventListener('click', () => this.downloadJSON());
        
        // Clear attendance
        document.getElementById('clear-attendance').addEventListener('click', () => this.clearAttendance());
        
        // Settings
        document.getElementById('teacher-name').addEventListener('input', () => this.saveSettings());
        document.getElementById('class-subject').addEventListener('input', () => this.saveSettings());
        document.getElementById('school-name').addEventListener('input', () => this.saveSettings());
        
        // Analytics
        document.getElementById('view-attendance').addEventListener('click', () => this.viewDateAttendance());
        
        // Feedback
        document.getElementById('feedback-period').addEventListener('change', (e) => this.handleFeedbackPeriodChange(e));
        document.getElementById('generate-feedback').addEventListener('click', () => this.generateFeedback());
        
        // Settings actions
        document.getElementById('export-all-data').addEventListener('click', () => this.exportAllData());
        document.getElementById('clear-all-data').addEventListener('click', () => this.clearAllData());
        
        // QR Generator initialization
        this.initializeQRGenerator();
        
        // Handle visibility change for camera management
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isScanning) {
                this.stopScanning();
            }
        });
    }

    async startScanning() {
        try {
            this.showLoading('Accessing camera...');
            
            // Check if camera is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access is not supported on this device');
            }

            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            this.video.srcObject = this.stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    resolve();
                };
            });

            // Setup canvas dimensions
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            this.isScanning = true;
            this.updateScannerUI();
            this.hideLoading();
            this.scanQRCode();
            
            this.showToast('Camera started successfully', 'success');
        } catch (error) {
            console.error('Error starting camera:', error);
            this.hideLoading();
            this.showToast('Failed to access camera: ' + error.message, 'error');
        }
    }

    stopScanning() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.isScanning = false;
        this.video.srcObject = null;
        this.updateScannerUI();
        this.showToast('Camera stopped', 'info');
    }

    scanQRCode() {
        // Continue scanning loop even if temporarily paused
        if (this.video && this.video.srcObject) {
            requestAnimationFrame(() => this.scanQRCode());
        }
        
        if (!this.isScanning) return;

        // Draw video frame to canvas
        this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Get image data
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Scan for QR codes
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            this.processQRCode(code.data);
        }
    }

    processQRCode(qrData) {
        try {
            // Parse QR code data (expecting JSON format)
            let studentData;
            
            try {
                studentData = JSON.parse(qrData);
            } catch (e) {
                // If not JSON, treat as student ID
                studentData = {
                    id: qrData,
                    name: `Student ${qrData}`
                };
            }

            // Validate required fields
            if (!studentData.id) {
                throw new Error('Invalid QR code: Missing student ID');
            }

            // Check if student already scanned today
            const today = new Date().toDateString();
            const existingEntry = this.attendanceData.find(entry => 
                entry.studentId === studentData.id && 
                new Date(entry.timestamp).toDateString() === today
            );

            if (existingEntry) {
                this.showToast(`${studentData.name || studentData.id} already scanned today`, 'info');
                return;
            }

            // Add to attendance
            const attendanceEntry = {
                studentId: studentData.id,
                studentName: studentData.name || `Student ${studentData.id}`,
                timestamp: new Date().toISOString(),
                date: new Date().toDateString(),
                time: new Date().toLocaleTimeString()
            };

            this.attendanceData.push(attendanceEntry);
            this.scanCount++;
            
            // Save and update UI
            this.saveAttendanceData();
            this.updateUI();
            
            this.showToast(`✓ ${attendanceEntry.studentName} marked present`, 'success');
            
            // Brief pause to prevent multiple scans
            this.isScanning = false;
            setTimeout(() => {
                if (this.video && this.video.srcObject) {
                    this.isScanning = true;
                    // Ensure scanning resumes after timeout
                    this.scanQRCode();
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error processing QR code:', error);
            this.showToast('Invalid QR code format', 'error');
        }
    }

    updateUI() {
        this.updateScanCount();
        this.updateAttendanceList();
    }

    updateScanCount() {
        const today = new Date().toDateString();
        const dayCount = this.attendanceData.filter(entry => 
            new Date(entry.timestamp).toDateString() === today
        ).length;
        
        // Update students count for today
        const studentsCountElement = document.getElementById('students-count');
        if (studentsCountElement) {
            studentsCountElement.textContent = dayCount;
        }
        
        // Update last scan time
        const lastScanElement = document.getElementById('last-scan');
        if (lastScanElement && dayCount > 0) {
            const lastScan = this.attendanceData
                .filter(entry => new Date(entry.timestamp).toDateString() === today)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            if (lastScan) {
                lastScanElement.textContent = new Date(lastScan.timestamp).toLocaleTimeString();
            }
        }
    }

    viewDateAttendance() {
        const selectedDate = document.getElementById('analytics-selected-date').value;
        
        if (!selectedDate) {
            this.showToast('Please select a date', 'error');
            return;
        }
        
        // Filter data for the selected date
        const selectedDateObj = new Date(selectedDate);
        const filteredData = this.attendanceData.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate.toDateString() === selectedDateObj.toDateString();
        });
        
        // Update summary cards
        this.updateAnalyticsSummary(selectedDate, filteredData);
        
        // Display student attendance list
        this.displayDateAttendanceList(filteredData, selectedDate);
    }

    updateAnalyticsSummary(selectedDate, attendanceData) {
        const selectedDateFormatted = new Date(selectedDate).toLocaleDateString();
        const studentsCount = attendanceData.length;
        
        // Find first and last scan times
        const sortedData = attendanceData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const firstScan = sortedData.length > 0 ? new Date(sortedData[0].timestamp).toLocaleTimeString() : '-';
        const lastScan = sortedData.length > 0 ? new Date(sortedData[sortedData.length - 1].timestamp).toLocaleTimeString() : '-';
        
        // Update summary cards
        document.getElementById('selected-date-display').textContent = selectedDateFormatted;
        document.getElementById('students-present-count').textContent = studentsCount;
        document.getElementById('first-scan-time').textContent = firstScan;
        document.getElementById('last-scan-time').textContent = lastScan;
    }

    displayDateAttendanceList(attendanceData, selectedDate) {
        const container = document.getElementById('analytics-attendance-list');
        const selectedDateFormatted = new Date(selectedDate).toLocaleDateString();
        
        if (attendanceData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No students scanned for ${selectedDateFormatted}</p>
                    <p>No attendance data found for the selected date</p>
                </div>
            `;
            return;
        }
        
        // Sort by scan time (most recent first)
        const sortedData = attendanceData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        container.innerHTML = sortedData.map(entry => `
            <div class="student-analytics-item">
                <div class="student-info">
                    <div class="student-name">${entry.studentName}</div>
                    <div class="attendance-stats">ID: ${entry.studentId} • Scanned at ${entry.time}</div>
                </div>
                <div class="attendance-status" style="color: #4CAF50">
                    ✓ Present
                </div>
            </div>
        `).join('');
    }

    getPercentageColor(percentage) {
        if (percentage >= 80) return '#4CAF50';
        if (percentage >= 60) return '#FF9800';
        return '#f44336';
    }

    handleFeedbackPeriodChange(event) {
        const customRange = document.getElementById('custom-feedback-range');
        if (event.target.value === 'custom') {
            customRange.style.display = 'flex';
        } else {
            customRange.style.display = 'none';
        }
    }

    generateFeedback() {
        const period = document.getElementById('feedback-period').value;
        const type = document.getElementById('feedback-type').value;
        
        let fromDate, toDate;
        const today = new Date();
        
        switch (period) {
            case 'today':
                fromDate = toDate = today.toISOString().split('T')[0];
                break;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                fromDate = weekAgo.toISOString().split('T')[0];
                toDate = today.toISOString().split('T')[0];
                break;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                fromDate = monthAgo.toISOString().split('T')[0];
                toDate = today.toISOString().split('T')[0];
                break;
            case 'custom':
                fromDate = document.getElementById('feedback-from-date').value;
                toDate = document.getElementById('feedback-to-date').value;
                if (!fromDate || !toDate) {
                    this.showToast('Please select both from and to dates for custom range', 'error');
                    return;
                }
                break;
        }
        
        // Filter data by date range
        const filteredData = this.attendanceData.filter(entry => {
            const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
            return entryDate >= fromDate && entryDate <= toDate;
        });
        
        // Group by student
        const studentReports = {};
        const uniqueStudents = new Set(this.attendanceData.map(entry => entry.studentId));
        
        uniqueStudents.forEach(studentId => {
            const studentData = filteredData.filter(entry => entry.studentId === studentId);
            const studentName = studentData[0]?.studentName || `Student ${studentId}`;
            
            const attendanceDays = new Set(studentData.map(entry => 
                new Date(entry.timestamp).toISOString().split('T')[0]
            )).size;
            
            const totalDays = this.getWorkingDays(fromDate, toDate);
            const percentage = totalDays > 0 ? (attendanceDays / totalDays) * 100 : 0;
            
            studentReports[studentId] = {
                name: studentName,
                attendanceDays,
                totalDays,
                percentage,
                status: this.getAttendanceStatus(percentage),
                recentAttendance: studentData.slice(-5) // Last 5 attendance records
            };
        });
        
        this.displayFeedbackReports(studentReports, type, period);
    }

    getWorkingDays(fromDate, toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        let workingDays = 0;
        
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const day = date.getDay();
            if (day !== 0 && day !== 6) { // Exclude weekends
                workingDays++;
            }
        }
        
        return workingDays;
    }

    getAttendanceStatus(percentage) {
        if (percentage >= 90) return { status: 'excellent', text: 'Excellent' };
        if (percentage >= 80) return { status: 'good', text: 'Good' };
        if (percentage >= 70) return { status: 'satisfactory', text: 'Satisfactory' };
        if (percentage >= 60) return { status: 'needs-improvement', text: 'Needs Improvement' };
        return { status: 'poor', text: 'Poor' };
    }

    displayFeedbackReports(studentReports, type, period) {
        const container = document.getElementById('feedback-reports');
        const settings = this.getSettings();
        
        if (Object.keys(studentReports).length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No students found for the selected period</p></div>';
            return;
        }
        
        const periodText = this.getPeriodText(period);
        
        const reportsHtml = Object.entries(studentReports).map(([studentId, report]) => {
            if (type === 'alerts' && report.percentage >= 80) {
                return ''; // Skip students with good attendance for alerts
            }
            
            return this.generateStudentReport(studentId, report, type, periodText, settings);
        }).filter(html => html).join('');
        
        if (!reportsHtml) {
            container.innerHTML = '<div class="empty-state"><p>No reports to show based on selected criteria</p></div>';
            return;
        }
        
        container.innerHTML = `
            <div class="feedback-header">
                <h3>📧 Parent Feedback Reports - ${periodText}</h3>
                <button class="btn btn-success" onclick="attendanceScanner.downloadAllReports()">
                    📄 Download All Reports
                </button>
            </div>
            ${reportsHtml}
        `;
    }

    generateStudentReport(studentId, report, type, period, settings) {
        const statusClass = `status-${report.status.status}`;
        
        let reportContent = '';
        
        if (type === 'summary') {
            reportContent = `
                <div class="report-summary">
                    <p><strong>Attendance Summary:</strong> ${report.attendanceDays}/${report.totalDays} days (${report.percentage.toFixed(1)}%)</p>
                    <p><strong>Status:</strong> <span class="${statusClass}">${report.status.text}</span></p>
                </div>
            `;
        } else if (type === 'detailed') {
            reportContent = `
                <div class="report-detailed">
                    <p><strong>Attendance:</strong> ${report.attendanceDays}/${report.totalDays} days (${report.percentage.toFixed(1)}%)</p>
                    <p><strong>Status:</strong> <span class="${statusClass}">${report.status.text}</span></p>
                    <div class="recent-attendance">
                        <strong>Recent Attendance:</strong>
                        <ul>
                            ${report.recentAttendance.map(entry => 
                                `<li>${new Date(entry.timestamp).toLocaleDateString()} - ${entry.time}</li>`
                            ).join('')}
                        </ul>
                    </div>
                </div>
            `;
        } else { // alerts
            reportContent = `
                <div class="report-alert">
                    <p><strong>⚠️ Attendance Alert:</strong> ${report.name} has ${report.percentage.toFixed(1)}% attendance</p>
                    <p>Please encourage regular attendance. Contact teacher if needed.</p>
                </div>
            `;
        }
        
        return `
            <div class="feedback-report">
                <div class="report-header">
                    <div class="report-student">${report.name} (ID: ${studentId})</div>
                    <div class="report-actions">
                        <button class="btn btn-small btn-info" onclick="attendanceScanner.downloadStudentReport('${studentId}')">
                            📄 Download
                        </button>
                    </div>
                </div>
                ${reportContent}
                <div class="report-footer">
                    <p><strong>Teacher:</strong> ${settings.teacherName || 'Not specified'}</p>
                    <p><strong>Class:</strong> ${settings.classSubject || 'Not specified'}</p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
        `;
    }

    getPeriodText(period) {
        switch (period) {
            case 'today': return 'Today';
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            case 'custom': return 'Custom Period';
            default: return 'Selected Period';
        }
    }

    updateAttendanceList() {
        const attendanceList = document.getElementById('attendance-list');
        const today = new Date().toDateString();
        
        // Filter attendance for current date
        const todayAttendance = this.attendanceData.filter(entry => 
            new Date(entry.timestamp).toDateString() === today
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (todayAttendance.length === 0) {
            attendanceList.innerHTML = `
                <div class="empty-state">
                    <p>No students scanned for ${new Date(today).toLocaleDateString()}</p>
                    <p>Start scanning to add students</p>
                </div>
            `;
            return;
        }

        attendanceList.innerHTML = todayAttendance.map(entry => `
            <div class="attendance-item">
                <div class="student-info">
                    <div class="student-name">${entry.studentName}</div>
                    <div class="student-id">ID: ${entry.studentId}</div>
                </div>
                <div class="scan-time">${entry.time}</div>
            </div>
        `).join('');
    }

    exportAllData() {
        if (this.attendanceData.length === 0) {
            this.showToast('No data to export', 'error');
            return;
        }
        
        const settings = this.getSettings();
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                teacher: settings.teacherName || 'Unknown',
                school: settings.schoolName || 'Unknown',
                classSubject: settings.classSubject || 'Unknown',
                totalRecords: this.attendanceData.length
            },
            attendance: this.attendanceData,
            settings: settings
        };
        
        const jsonContent = JSON.stringify(exportData, null, 2);
        const fileName = `attendance_export_${new Date().toISOString().split('T')[0]}.json`;
        
        this.downloadFile(jsonContent, fileName, 'application/json');
        this.showToast('All data exported successfully', 'success');
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear ALL attendance data? This action cannot be undone.')) {
            this.attendanceData = [];
            this.saveAttendanceData();
            this.updateUI();
            this.showToast('All data cleared', 'info');
        }
    }

    downloadAllReports() {
        // This would generate a comprehensive report with all student feedback
        const settings = this.getSettings();
        const reportData = {
            school: settings.schoolName || 'School Name',
            teacher: settings.teacherName || 'Teacher Name',
            class: settings.classSubject || 'Class/Subject',
            generatedDate: new Date().toLocaleDateString(),
            reports: document.getElementById('feedback-reports').innerHTML
        };
        
        const htmlContent = this.generateHTMLReport(reportData);
        this.downloadFile(htmlContent, `parent_feedback_reports_${new Date().toISOString().split('T')[0]}.html`, 'text/html');
        this.showToast('All reports downloaded', 'success');
    }

    downloadStudentReport(studentId) {
        // Implementation for downloading individual student report
        this.showToast(`Downloading report for student ${studentId}`, 'info');
    }

    generateHTMLReport(data) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Parent Feedback Reports - ${data.class}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .feedback-report { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                    .report-header { font-weight: bold; margin-bottom: 10px; }
                    .status-excellent { color: #4CAF50; }
                    .status-good { color: #2196F3; }
                    .status-satisfactory { color: #FF9800; }
                    .status-needs-improvement { color: #FF5722; }
                    .status-poor { color: #f44336; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Parent Feedback Reports</h1>
                    <p><strong>School:</strong> ${data.school}</p>
                    <p><strong>Teacher:</strong> ${data.teacher}</p>
                    <p><strong>Class:</strong> ${data.class}</p>
                    <p><strong>Generated:</strong> ${data.generatedDate}</p>
                </div>
                ${data.reports}
            </body>
            </html>
        `;
    }

    updateDateTime() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            currentDateElement.textContent = dateStr;
        }
        
        // Always keep selectedDate as current date
        this.selectedDate = now.toISOString().split('T')[0];
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.nav-tab');
        const tabContents = document.querySelectorAll('.tab-content');
        const navTabs = document.querySelector('.nav-tabs');
        
        // Function to update sliding indicator position
        const updateSlider = (activeIndex) => {
            const translateX = activeIndex * 100;
            navTabs.style.setProperty('--slider-position', `${translateX}%`);
        };
        
        // Initialize slider position for the active tab
        const activeTabIndex = Array.from(tabButtons).findIndex(btn => btn.classList.contains('active'));
        updateSlider(activeTabIndex >= 0 ? activeTabIndex : 0);
        
        tabButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                const targetContent = document.getElementById(targetTab + '-tab');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                // Update slider position
                updateSlider(index);
            });
        });
    }

    initializeDatePickers() {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        this.selectedDate = today; // Always use current date
        
        // Initialize analytics date pickers
        const analyticsSelectedDate = document.getElementById('analytics-selected-date');
        if (analyticsSelectedDate) {
            analyticsSelectedDate.value = today;
        }
    }

    updateScannerUI() {
        const startBtn = document.getElementById('start-scan');
        const stopBtn = document.getElementById('stop-scan');
        
        if (this.isScanning) {
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
        } else {
            startBtn.style.display = 'inline-flex';
            stopBtn.style.display = 'none';
        }
    }

    clearAttendance() {
        if (confirm('Are you sure you want to clear today\'s attendance? This action cannot be undone.')) {
            const today = new Date().toDateString();
            this.attendanceData = this.attendanceData.filter(entry => 
                new Date(entry.timestamp).toDateString() !== today
            );
            
            this.saveAttendanceData();
            this.updateUI();
            this.showToast('Today\'s attendance cleared', 'info');
        }
    }

    downloadCSV() {
        const today = new Date().toDateString();
        const todayAttendance = this.attendanceData.filter(entry => 
            new Date(entry.timestamp).toDateString() === today
        );

        if (todayAttendance.length === 0) {
            this.showToast('No attendance data to download', 'error');
            return;
        }

        const settings = this.getSettings();
        const csvContent = this.generateCSV(todayAttendance, settings);
        const fileName = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
        
        this.downloadFile(csvContent, fileName, 'text/csv');
        this.showToast('CSV file downloaded', 'success');
    }

    downloadJSON() {
        const today = new Date().toDateString();
        const todayAttendance = this.attendanceData.filter(entry => 
            new Date(entry.timestamp).toDateString() === today
        );

        if (todayAttendance.length === 0) {
            this.showToast('No attendance data to download', 'error');
            return;
        }

        const settings = this.getSettings();
        const attendanceReport = {
            metadata: {
                date: new Date().toISOString(),
                teacher: settings.teacherName || 'Unknown',
                classSubject: settings.classSubject || 'Unknown',
                totalStudents: todayAttendance.length,
                generatedAt: new Date().toISOString()
            },
            attendance: todayAttendance
        };

        const jsonContent = JSON.stringify(attendanceReport, null, 2);
        const fileName = `attendance_${new Date().toISOString().split('T')[0]}.json`;
        
        this.downloadFile(jsonContent, fileName, 'application/json');
        this.showToast('JSON file downloaded', 'success');
    }

    generateCSV(data, settings) {
        const headers = ['Student ID', 'Student Name', 'Date', 'Time', 'Timestamp'];
        const rows = data.map(entry => [
            entry.studentId,
            entry.studentName,
            entry.date,
            entry.time,
            entry.timestamp
        ]);

        // Add metadata rows
        const metadata = [
            ['Attendance Report'],
            ['Teacher:', settings.teacherName || 'Not specified'],
            ['Class/Subject:', settings.classSubject || 'Not specified'],
            ['Date:', new Date().toLocaleDateString()],
            ['Total Students:', data.length.toString()],
            [''],
            headers
        ];

        const allRows = [...metadata, ...rows];
        
        return allRows.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    saveAttendanceData() {
        try {
            localStorage.setItem('attendanceData', JSON.stringify(this.attendanceData));
        } catch (error) {
            console.error('Error saving attendance data:', error);
            this.showToast('Failed to save attendance data', 'error');
        }
    }

    loadAttendanceData() {
        try {
            const saved = localStorage.getItem('attendanceData');
            if (saved) {
                this.attendanceData = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading attendance data:', error);
            this.attendanceData = [];
        }
    }

    saveSettings() {
        const settings = {
            teacherName: document.getElementById('teacher-name').value,
            classSubject: document.getElementById('class-subject').value,
            schoolName: document.getElementById('school-name')?.value || ''
        };
        
        try {
            localStorage.setItem('appSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('appSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                document.getElementById('teacher-name').value = settings.teacherName || '';
                document.getElementById('class-subject').value = settings.classSubject || '';
                const schoolNameElement = document.getElementById('school-name');
                if (schoolNameElement) {
                    schoolNameElement.value = settings.schoolName || '';
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    getSettings() {
        return {
            teacherName: document.getElementById('teacher-name').value,
            classSubject: document.getElementById('class-subject').value,
            schoolName: document.getElementById('school-name')?.value || ''
        };
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    showLoading(message = 'Loading...') {
        const loading = document.getElementById('loading');
        loading.querySelector('p').textContent = message;
        loading.classList.remove('hidden');
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        loading.classList.add('hidden');
    }

    // QR Generator Methods
    initializeQRGenerator() {
        // Initialize with sample data
        const batchData = document.getElementById('batch-data');
        if (batchData) {
            batchData.value = `123456,John Doe\n123457,Jane Smith\n123458,Bob Johnson\n123459,Alice Brown\n123460,Charlie Davis`;
        }

        // Initialize QR generator variables
        this.currentQRUrl = null;
        this.batchQRCodes = [];
    }

    generateQRCodeURL(data, size = 300) {
        // Primary: QR Server API
        const encodedData = encodeURIComponent(data);
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=png&margin=10`;
    }

    generateQRCodeURLFallback(data, size = 300) {
        // Fallback: Google Charts API
        const encodedData = encodeURIComponent(data);
        return `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodedData}&choe=UTF-8`;
    }

    generateBatchQR() {
        const batchData = document.getElementById('batch-data').value.trim();
        const format = 'json'; // Default to JSON format for batch generation
        const size = document.getElementById('batch-size').value;

        if (!batchData) {
            this.showToast('Please enter student data', 'error');
            return;
        }

        // Better line splitting to handle different line endings
        const lines = batchData.split(/\r?\n/).filter(line => line.trim());
        const container = document.getElementById('batch-qr-container');
        const statusDiv = document.getElementById('batch-status');
        
        container.innerHTML = '';
        this.batchQRCodes = [];

        let successCount = 0;
        let errorCount = 0;

        statusDiv.innerHTML = '<div class="status-message info">Generating QR codes...</div>';

        lines.forEach((line, index) => {
            const [id, name] = line.split(',').map(s => s.trim());
            
            if (!id) {
                errorCount++;
                return;
            }

            let qrData;
            if (format === 'json') {
                qrData = JSON.stringify({
                    id: id,
                    name: name || `Student ${id}`
                });
            } else {
                qrData = id;
            }

            try {
                const qrUrl = this.generateQRCodeURL(qrData, size);
                
                const qrItem = document.createElement('div');
                qrItem.className = 'qr-item';
                qrItem.innerHTML = `
                    <h4>${name || `Student ${id}`}</h4>
                    <p><strong>ID:</strong> ${id}</p>
                    <img src="${qrUrl}" alt="QR Code for ${id}" loading="lazy"
                         onerror="this.src='${this.generateQRCodeURLFallback(qrData, size)}'; this.onerror=null;">
                    <button class="btn btn-small btn-success" 
                            onclick="attendanceScanner.downloadImageFromUrl('${qrUrl}', 'student-qr-${id}.png')">💾 Download</button>
                `;

                container.appendChild(qrItem);
                
                this.batchQRCodes.push({
                    id: id,
                    name: name || `Student ${id}`,
                    url: qrUrl,
                    data: qrData
                });
                
                successCount++;
            } catch (error) {
                console.error('Error generating QR for student', id, error);
                errorCount++;
            }
        });

        // Update status
        statusDiv.innerHTML = `
            <div class="status-message success">
                <h3>Generation Complete</h3>
                <p>✅ Successfully generated: ${successCount} QR codes</p>
                ${errorCount > 0 ? `<p style="color: red;">❌ Errors: ${errorCount}</p>` : ''}
            </div>
        `;

        document.getElementById('download-batch-btn').disabled = this.batchQRCodes.length === 0;
        document.getElementById('print-sheet-btn').disabled = this.batchQRCodes.length === 0;
        
        this.showToast(`Generated ${successCount} QR codes`, 'success');
    }

    downloadImageFromUrl(url, filename) {
        // Create a temporary link to download the image
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        
        // For better browser compatibility
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    downloadAllQR() {
        if (this.batchQRCodes.length === 0) {
            this.showToast('Please generate batch QR codes first', 'error');
            return;
        }

        this.batchQRCodes.forEach((qr, index) => {
            setTimeout(() => {
                this.downloadImageFromUrl(qr.url, `student-qr-${qr.id}.png`);
            }, index * 500); // Stagger downloads
        });

        this.showToast(`Downloading ${this.batchQRCodes.length} QR codes...`, 'info');
    }

    clearBatch() {
        if (confirm('Are you sure you want to clear all generated QR codes?')) {
            document.getElementById('batch-qr-container').innerHTML = '';
            document.getElementById('batch-status').innerHTML = '';
            this.batchQRCodes = [];
            document.getElementById('download-batch-btn').disabled = true;
            document.getElementById('print-sheet-btn').disabled = true;
            this.showToast('QR codes cleared', 'info');
        }
    }

    generatePrintableSheet() {
        if (this.batchQRCodes.length === 0) {
            this.showToast('Please generate batch QR codes first', 'error');
            return;
        }

        // Create printable content
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Student QR Codes - Print Sheet</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        background: white;
                    }
                    .print-header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                        border-bottom: 2px solid #333; 
                        padding-bottom: 20px; 
                    }
                    .print-grid { 
                        display: grid; 
                        grid-template-columns: repeat(4, 1fr); 
                        gap: 20px; 
                        margin: 30px 0; 
                    }
                    .print-qr-item { 
                        text-align: center; 
                        padding: 15px; 
                        border: 1px solid #000; 
                        border-radius: 8px; 
                        page-break-inside: avoid;
                    }
                    .print-qr-item h4 { 
                        margin: 5px 0; 
                        font-size: 14px; 
                        color: #333; 
                    }
                    .print-qr-item p { 
                        margin: 3px 0; 
                        font-size: 12px; 
                        color: #666; 
                    }
                    .print-qr-item img { 
                        width: 120px; 
                        height: 120px; 
                        margin: 8px 0; 
                    }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h1>Student QR Codes - ID Cards</h1>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    <p>Total Students: ${this.batchQRCodes.length}</p>
                </div>
                
                <div class="print-grid">
                    ${this.batchQRCodes.map(qr => `
                        <div class="print-qr-item">
                            <h4>${qr.name}</h4>
                            <p>ID: ${qr.id}</p>
                            <img src="${this.generateQRCodeURL(qr.data, 200)}" alt="QR Code for ${qr.id}">
                            <p style="font-size: 10px; margin-top: 5px;">Scan for attendance</p>
                        </div>
                    `).join('')}
                </div>
                
                <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
                    <p>Cut along the lines and attach to student ID cards</p>
                    <p>Minimum recommended print size: 2cm x 2cm per QR code</p>
                </div>
            </body>
            </html>
        `;
        
        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for images to load then trigger print dialog
        setTimeout(() => {
            printWindow.print();
        }, 1000);
        
        this.showToast('Print sheet generated', 'success');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    }

    // Initialize the attendance scanner
    window.attendanceScanner = new AttendanceScanner();
});

// Handle app installation prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or prompt
    console.log('App can be installed');
});

// Handle successful installation
window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed');
});

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});