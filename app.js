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
        
        // Firebase configuration
        this.firebaseConfig = {
            apiKey: "AIzaSyDZ5SOWINosulgoIjcobAfiNEXuMiY4RUY",
            authDomain: "rural-attendance.firebaseapp.com",
            projectId: "rural-attendance",
            storageBucket: "rural-attendance.firebasestorage.app",
            messagingSenderId: "340744415747",
            appId: "1:340744415747:web:3d7d7634ee43b33444bc36",
            measurementId: "G-KBGB79CN0Z"
        };
        
        this.db = null;
        this.isOnline = navigator.onLine;
        this.pendingSyncData = [];
        this.isSyncing = false;
        this.lastSyncAttempt = 0;
        this.syncDebounceTimeout = null;
        
        // Capacitor plugins initialization
        this.isCapacitor = typeof window.Capacitor !== 'undefined';
        this.initializeCapacitorPlugins();
        
        this.init();
    }

    init() {
        // Ensure DOM is ready before proceeding
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }
    
    initializeApp() {
        this.initializeFirebase();
        this.setupOnlineOfflineListeners();
        this.setupEventListeners();
        this.setupTabNavigation();
        this.loadSettings();
        this.loadAttendanceData();
        this.loadPendingSyncData();
        this.updateUI();
        this.updateDateTime();
        this.initializeDatePickers();
        
        // Update date every minute
        setInterval(() => this.updateDateTime(), 60000);
        
        // Sync data every 5 minutes if online (with debouncing)
        setInterval(() => {
            if (this.isOnline && this.db && !this.isSyncing) {
                this.syncDataToFirebase();
            }
        }, 300000);
        
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
        document.getElementById('sync-to-cloud').addEventListener('click', () => this.syncDataToFirebase('manual'));
        document.getElementById('download-cloud-data').addEventListener('click', () => this.downloadCloudData());
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
        if (this.isCapacitor) {
            this.downloadFileNative(content, fileName, mimeType);
        } else {
            this.downloadFileBrowser(content, fileName, mimeType);
        }
    }
    
    async downloadFileNative(content, fileName, mimeType) {
        try {
            const { Filesystem } = window.Capacitor.Plugins;
            const { Share } = window.Capacitor.Plugins;
            
            // Write file to device storage
            const result = await Filesystem.writeFile({
                path: fileName,
                data: content,
                directory: 'DOCUMENTS',
                encoding: 'utf8'
            });
            
            this.showToast(`File saved: ${fileName}`, 'success');
            
            // Optionally share the file
            if (Share) {
                const shouldShare = confirm('File saved successfully. Would you like to share it?');
                if (shouldShare) {
                    await Share.share({
                        title: fileName,
                        text: `Attendance data from Rural Attendance Scanner`,
                        url: result.uri
                    });
                }
            }
        } catch (error) {
            console.error('Error saving file natively:', error);
            this.showToast('Error saving file: ' + error.message, 'error');
            // Fallback to browser download
            this.downloadFileBrowser(content, fileName, mimeType);
        }
    }
    
    downloadFileBrowser(content, fileName, mimeType) {
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
            
            // Trigger cloud sync if online (with debouncing to avoid excessive calls)
            if (this.isOnline && this.db && !this.isSyncing) {
                clearTimeout(this.syncTimeout);
                this.syncTimeout = setTimeout(() => {
                    this.syncDataToFirebase();
                }, 2000);
            }
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
                
                // Ensure DOM elements exist before setting values
                const teacherNameEl = document.getElementById('teacher-name');
                const classSubjectEl = document.getElementById('class-subject');
                const schoolNameEl = document.getElementById('school-name');
                
                if (teacherNameEl) {
                    teacherNameEl.value = settings.teacherName || '';
                }
                if (classSubjectEl) {
                    classSubjectEl.value = settings.classSubject || '';
                }
                if (schoolNameEl) {
                    schoolNameEl.value = settings.schoolName || '';
                }
                
                console.log('Settings loaded:', settings);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    getSettings() {
        // Try to get from DOM elements first
        const teacherNameEl = document.getElementById('teacher-name');
        const classSubjectEl = document.getElementById('class-subject');
        const schoolNameEl = document.getElementById('school-name');
        
        let settings = {
            teacherName: '',
            classSubject: '',
            schoolName: ''
        };
        
        // Get values from DOM if elements exist
        if (teacherNameEl) settings.teacherName = teacherNameEl.value || '';
        if (classSubjectEl) settings.classSubject = classSubjectEl.value || '';
        if (schoolNameEl) settings.schoolName = schoolNameEl.value || '';
        
        // If DOM elements don't exist or are empty, try localStorage as backup
        if (!settings.teacherName || !settings.schoolName) {
            try {
                const saved = localStorage.getItem('appSettings');
                if (saved) {
                    const savedSettings = JSON.parse(saved);
                    settings.teacherName = settings.teacherName || savedSettings.teacherName || '';
                    settings.classSubject = settings.classSubject || savedSettings.classSubject || '';
                    settings.schoolName = settings.schoolName || savedSettings.schoolName || '';
                }
            } catch (error) {
                console.error('Error loading settings from localStorage:', error);
            }
        }
        
        return settings;
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

    // Firebase Integration Methods
    initializeCapacitorPlugins() {
        if (!this.isCapacitor) {
            console.log('Running in browser mode');
            return;
        }
        
        try {
            // Initialize Capacitor plugins
            const { StatusBar } = window.Capacitor.Plugins;
            const { SplashScreen } = window.Capacitor.Plugins;
            const { Network } = window.Capacitor.Plugins;
            const { Device } = window.Capacitor.Plugins;
            
            // Set status bar style
            if (StatusBar) {
                StatusBar.setStyle({ style: 'DARK' });
                StatusBar.setBackgroundColor({ color: '#667eea' });
            }
            
            // Hide splash screen after app loads
            if (SplashScreen) {
                setTimeout(() => {
                    SplashScreen.hide();
                }, 2000);
            }
            
            // Monitor network status
            if (Network) {
                Network.addListener('networkStatusChange', (status) => {
                    this.isOnline = status.connected;
                    if (status.connected) {
                        this.updateSyncStatus('online', 'Connected - Auto sync enabled');
                        this.syncDataToFirebase();
                    } else {
                        this.updateSyncStatus('offline', 'Offline - Data will sync when connected');
                    }
                });
                
                // Get initial network status
                Network.getStatus().then((status) => {
                    this.isOnline = status.connected;
                });
            }
            
            console.log('Capacitor plugins initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Capacitor plugins:', error);
        }
    }

    initializeFirebase() {
        try {
            // Only initialize if Firebase is available
            if (typeof firebase !== 'undefined') {
                // Use demo config by default - users should replace with their own
                const defaultConfig = {
                    apiKey: "AIzaSyCcn9HfE4RGoyNzR6pVJ9Lihg2jRXrRup8",
                    authDomain: "gndu-attendance-system.firebaseapp.com",
                    projectId: "gndu-attendance-system",
                    storageBucket: "gndu-attendance-system.firebasestorage.app",
                    messagingSenderId: "874240831454",
                    appId: "1:874240831454:web:aaaa1909d87d9a77e0f74f",
                    measurementId: "G-7TNPBZ3ZZN"
                };
                
                // Initialize Firebase
                if (!firebase.apps.length) {
                    // Check if user has configured their own Firebase project
                    const hasValidConfig = this.firebaseConfig.apiKey !== 'your-api-key' && 
                                         this.firebaseConfig.projectId !== 'your-project-id';
                    
                    firebase.initializeApp(hasValidConfig ? this.firebaseConfig : defaultConfig);
                }
                
                this.db = firebase.firestore();
                
                // Only enable network if we have a valid configuration
                const hasValidConfig = this.firebaseConfig.apiKey !== 'your-api-key';
                if (!hasValidConfig) {
                    console.log('Using demo Firebase config - cloud sync disabled');
                    this.db = null;
                    this.updateSyncStatus('offline', 'Cloud sync disabled - Configure Firebase to enable');
                    return;
                }
                
                console.log('Firebase initialized successfully');
                
                // Try to sync existing data if online
                if (this.isOnline) {
                    this.syncDataToFirebase();
                }
            } else {
                console.log('Firebase not available - running in offline-only mode');
                this.updateSyncStatus('offline', 'Firebase not available - offline only');
            }
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.db = null;
            this.updateSyncStatus('error', 'Firebase setup failed - offline only');
            this.showToast('Cloud sync unavailable - running offline only', 'info');
        }
    }

    setupOnlineOfflineListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateSyncStatus('online', 'Connected - Auto sync enabled');
            this.showToast('Internet connection restored', 'success');
            // Only sync if we're not already syncing
            if (!this.isSyncing) {
                this.syncDataToFirebase();
            }
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateSyncStatus('offline', 'Offline - Data will sync when connected');
            this.showToast('Working offline - data will sync when connected', 'info');
        });
        
        // Initialize sync status
        this.updateSyncStatus(
            this.isOnline ? 'online' : 'offline',
            this.isOnline ? 'Connected - Auto sync enabled' : 'Offline - Data will sync when connected'
        );
    }

    async syncDataToFirebase() {
        // Debounce sync calls to prevent excessive notifications
        const now = Date.now();
        const minInterval = 5000; // Minimum 5 seconds between sync attempts
        
        if (this.isSyncing) {
            console.log('Sync already in progress, skipping...');
            return;
        }
        
        if (now - this.lastSyncAttempt < minInterval) {
            console.log('Sync called too frequently, debouncing...');
            clearTimeout(this.syncDebounceTimeout);
            this.syncDebounceTimeout = setTimeout(() => {
                this.syncDataToFirebase();
            }, minInterval - (now - this.lastSyncAttempt));
            return;
        }
        
        if (!this.isOnline || !this.db) {
            this.updateSyncStatus('offline', 'Offline - Cannot sync to cloud');
            return;
        }

        try {
            this.isSyncing = true;
            this.lastSyncAttempt = now;
            this.updateSyncStatus('syncing', 'Syncing data to cloud...');
            
            const settings = this.getSettings();
            const deviceId = this.getDeviceId();
            
            // Validate settings before sync - only check if we have meaningful data to sync
            if (this.attendanceData.length > 0 && (!settings.schoolName || !settings.teacherName)) {
                this.updateSyncStatus('error', 'Please configure school and teacher name in Settings');
                this.showToast('Please set school and teacher name in Settings before syncing', 'error');
                return;
            }
            
            // If no attendance data, just skip sync silently
            if (this.attendanceData.length === 0) {
                console.log('No attendance data to sync');
                return;
            }
            
            // Create a unique collection path based on school/teacher
            const collectionPath = `schools/${settings.schoolName.replace(/[^a-zA-Z0-9]/g, '_')}/attendance`;
            
            let syncedCount = 0;
            
            // Test Firebase permissions first with a simple read
            try {
                await this.db.collection('test').limit(1).get();
            } catch (permError) {
                if (permError.code === 'permission-denied') {
                    this.updateSyncStatus('error', 'Firebase permissions not configured - check Firestore rules');
                    this.showToast('Firebase permissions denied. Please configure Firestore security rules.', 'error');
                    return;
                }
                throw permError;
            }
            
            // Sync attendance data
            for (const entry of this.attendanceData) {
                if (!entry.synced) {
                    try {
                        const docRef = this.db.collection(collectionPath).doc();
                        await docRef.set({
                            ...entry,
                            deviceId: deviceId,
                            teacherName: settings.teacherName,
                            classSubject: settings.classSubject || 'Unknown',
                            schoolName: settings.schoolName,
                            syncedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            synced: true
                        });
                        
                        // Mark as synced in local data
                        entry.synced = true;
                        syncedCount++;
                    } catch (entryError) {
                        console.error('Failed to sync entry:', entry.studentId, entryError);
                        // Continue with other entries
                    }
                }
            }
            
            // Save updated local data
            this.saveAttendanceData();
            
            // Clear pending sync data
            this.pendingSyncData = [];
            this.savePendingSyncData();
            
            this.updateSyncStatus('online', `Synced successfully - ${syncedCount} records uploaded`);
            
            if (syncedCount > 0) {
                this.showToast(`Synced ${syncedCount} records to cloud`, 'success');
            } else {
                // Only show this message if manually triggered
                if (arguments.length > 0 && arguments[0] === 'manual') {
                    this.showToast('All data already synced', 'info');
                }
            }
            
            console.log('Data synced to Firebase successfully');
        } catch (error) {
            console.error('Failed to sync data to Firebase:', error);
            
            // Handle specific Firebase errors
            if (error.code === 'permission-denied') {
                this.updateSyncStatus('error', 'Permission denied - Check Firestore rules');
                this.showToast('Firebase permission denied. Please check your Firestore security rules.', 'error');
            } else if (error.code === 'unavailable') {
                this.updateSyncStatus('error', 'Firebase service unavailable - Will retry');
                this.showToast('Firebase temporarily unavailable - Will retry automatically', 'error');
            } else if (error.code === 'unauthenticated') {
                this.updateSyncStatus('error', 'Authentication required');
                this.showToast('Authentication required for cloud sync', 'error');
            } else {
                this.updateSyncStatus('error', 'Sync failed - Will retry automatically');
                this.showToast('Sync failed - Will retry when connection improves', 'error');
            }
            
            // Add failed data to pending sync
            const unsyncedData = this.attendanceData.filter(entry => !entry.synced);
            this.pendingSyncData = [...this.pendingSyncData, ...unsyncedData];
            this.savePendingSyncData();
        } finally {
            this.isSyncing = false;
        }
    }

    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    loadPendingSyncData() {
        try {
            const saved = localStorage.getItem('pendingSyncData');
            if (saved) {
                this.pendingSyncData = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading pending sync data:', error);
            this.pendingSyncData = [];
        }
    }

    savePendingSyncData() {
        try {
            localStorage.setItem('pendingSyncData', JSON.stringify(this.pendingSyncData));
        } catch (error) {
            console.error('Error saving pending sync data:', error);
        }
    }

    async downloadCloudData() {
        if (!this.isOnline || !this.db) {
            this.showToast('Cloud sync not available', 'error');
            return;
        }

        try {
            const settings = this.getSettings();
            const collectionPath = `schools/${settings.schoolName || 'default'}/attendance`;
            
            this.showToast('Downloading cloud data...', 'info');
            
            const snapshot = await this.db.collection(collectionPath)
                .where('teacherName', '==', settings.teacherName || 'Unknown')
                .orderBy('timestamp', 'desc')
                .limit(1000)
                .get();
            
            const cloudData = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                cloudData.push({
                    studentId: data.studentId,
                    studentName: data.studentName,
                    timestamp: data.timestamp,
                    date: data.date,
                    time: data.time,
                    synced: true
                });
            });
            
            // Merge with local data (avoid duplicates)
            const mergedData = [...this.attendanceData];
            cloudData.forEach(cloudEntry => {
                const exists = mergedData.some(localEntry => 
                    localEntry.studentId === cloudEntry.studentId &&
                    localEntry.timestamp === cloudEntry.timestamp
                );
                if (!exists) {
                    mergedData.push(cloudEntry);
                }
            });
            
            this.attendanceData = mergedData;
            this.saveAttendanceData();
            this.updateUI();
            
            this.showToast(`Downloaded ${cloudData.length} cloud records`, 'success');
        } catch (error) {
            console.error('Failed to download cloud data:', error);
            this.showToast('Failed to download cloud data', 'error');
        }
    }

    updateSyncStatus(status, message) {
        const syncStatusElement = document.getElementById('sync-status');
        if (syncStatusElement) {
            syncStatusElement.className = `sync-status ${status}`;
            syncStatusElement.textContent = message;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
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