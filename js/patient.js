class PatientDashboard {
    constructor() {
        this.userId = localStorage.getItem('userId');
        this.userEmail = localStorage.getItem('userEmail');
        this.readings = [];
        this.alerts = [];
        this.bpChart = null;
        
        if (!this.userId) {
            window.location.href = 'index.html';
            return;
        }
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.loadDashboard();
        this.updateDateDisplay();
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });
    }

    showPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        document.getElementById(`${page}-page`).classList.add('active');
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        window.scrollTo(0, 0);
    }

    setupEventListeners() {
        document.getElementById('logReadingForm')?.addEventListener('submit', (e) => {
            this.handleLogReading(e);
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            Auth.logout('patient');
        });

        document.getElementById('alertsToggle')?.addEventListener('change', (e) => {
            this.saveSettings({ alertsEnabled: e.target.checked });
        });
    }

    async loadDashboard() {
        this.loadReadings();
        this.loadAlerts();
        this.displayProfileInfo();
    }

    loadReadings() {
        const stored = localStorage.getItem('readings_' + this.userId);
        this.readings = stored ? JSON.parse(stored) : this.generateMockReadings();
        
        if (this.readings.length > 0) {
            this.displayLatestReading();
            this.drawChart();
            this.displayReadingsList();
        }
    }

    generateMockReadings() {
        const readings = [];
        const now = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            readings.push({
                id: 'reading_' + Math.random().toString(36).substr(2, 9),
                systolic: Math.floor(Math.random() * 40 + 110),
                diastolic: Math.floor(Math.random() * 30 + 70),
                pulse: Math.floor(Math.random() * 30 + 60),
                timestamp: date.toISOString(),
                status: Math.random() > 0.7 ? 'high' : 'normal'
            });
        }
        
        localStorage.setItem('readings_' + this.userId, JSON.stringify(readings));
        return readings;
    }

    displayLatestReading() {
        const latest = this.readings[this.readings.length - 1];
        if (!latest) return;

        document.getElementById('bpValue').textContent = `${latest.systolic}/${latest.diastolic}`;
        document.getElementById('bpPulse').textContent = `${latest.pulse} bpm`;
        document.getElementById('bpTime').textContent = new Date(latest.timestamp).toLocaleString();
        
        const status = latest.systolic > 140 ? 'high' : latest.systolic > 130 ? 'elevated' : 'normal';
        const statusEl = document.getElementById('bpStatus');
        statusEl.className = `bp-status-pill ${status}`;
        statusEl.innerHTML = `<span class="dot"></span>${status.charAt(0).toUpperCase() + status.slice(1)}`;
    }

    drawChart() {
        const ctx = document.getElementById('bpChart')?.getContext('2d');
        if (!ctx) return;

        const labels = this.readings.map(r => new Date(r.timestamp).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }));
        const systolicData = this.readings.map(r => r.systolic);

        if (this.bpChart) this.bpChart.destroy();

        this.bpChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Systolic (mmHg)',
                    data: systolicData,
                    borderColor: 'var(--fire-2)',
                    backgroundColor: 'rgba(248, 125, 45, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 60,
                        max: 180
                    }
                }
            }
        });
    }

    displayReadingsList() {
        const container = document.getElementById('readings-list');
        const sorted = [...this.readings].reverse().slice(0, 5);

        container.innerHTML = sorted.map(r => `
            <div class="reading-item">
                <div style="display:flex;justify-content:space-between;align-items:center;width:100%;gap:12px;">
                    <div style="flex:1;">
                        <div class="reading-bp">${r.systolic}/${r.diastolic}</div>
                        <div class="reading-time">${new Date(r.timestamp).toLocaleString()}</div>
                    </div>
                    <span class="status-badge ${r.status}">${r.status.toUpperCase()}</span>
                </div>
            </div>
        `).join('');
    }

    loadAlerts() {
        const stored = localStorage.getItem('alerts_' + this.userId);
        this.alerts = stored ? JSON.parse(stored) : [];
        this.displayAlerts();
    }

    displayAlerts() {
        const container = document.getElementById('alerts-list');
        
        if (this.alerts.length === 0) {
            container.innerHTML = '<p class="empty-state">No alerts</p>';
            return;
        }

        container.innerHTML = this.alerts.map(a => `
            <div class="alert-item ${a.severity}">
                <div style="display:flex;justify-content:space-between;">
                    <div>
                        <strong>${a.severity.toUpperCase()}</strong>
                        <p style="font-size:12px;color:var(--text-3);margin-top:4px;">${a.message}</p>
                    </div>
                    <small>${new Date(a.timestamp).toLocaleString()}</small>
                </div>
            </div>
        `).join('');
    }

    handleLogReading(e) {
        e.preventDefault();

        const systolic = parseInt(document.getElementById('systolic').value);
        const diastolic = parseInt(document.getElementById('diastolic').value);
        const pulse = parseInt(document.getElementById('pulse').value);

        if (systolic < 60 || systolic > 250 || diastolic < 40 || diastolic > 150) {
            const msg = document.getElementById('logMessage');
            msg.textContent = '⚠️ Please enter valid BP readings';
            msg.style.color = 'var(--yellow)';
            setTimeout(() => { msg.textContent = ''; }, 3000);
            return;
        }

        const reading = {
            id: 'reading_' + Math.random().toString(36).substr(2, 9),
            systolic,
            diastolic,
            pulse,
            timestamp: new Date().toISOString(),
            status: systolic > 140 ? 'high' : systolic > 130 ? 'elevated' : 'normal'
        };

        this.readings.push(reading);
        localStorage.setItem('readings_' + this.userId, JSON.stringify(this.readings));

        if (reading.status !== 'normal') {
            const alert = {
                id: 'alert_' + Math.random().toString(36).substr(2, 9),
                severity: reading.status,
                message: `BP reading: ${reading.systolic}/${reading.diastolic} mmHg`,
                timestamp: new Date().toISOString()
            };
            this.alerts.push(alert);
            localStorage.setItem('alerts_' + this.userId, JSON.stringify(this.alerts));
        }

        const msg = document.getElementById('logMessage');
        msg.textContent = '✓ Reading saved successfully';
        msg.style.color = '#4ade80';

        document.getElementById('logReadingForm').reset();
        setTimeout(() => {
            msg.textContent = '';
            this.showPage('dashboard');
            this.loadDashboard();
        }, 1000);
    }

    displayProfileInfo() {
        document.getElementById('profileEmail').textContent = this.userEmail;
        document.getElementById('profileId').textContent = this.userId;
        
        const phone = localStorage.getItem('userPhone_' + this.userId) || '+267 XXXXXXX';
        document.getElementById('profilePhone').textContent = phone;
    }

    updateDateDisplay() {
        const el = document.getElementById('todayDate');
        if (el) {
            el.textContent = new Date().toLocaleDateString('en-GB', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short' 
            });
        }
    }

    saveSettings(settings) {
        const current = JSON.parse(localStorage.getItem('patientSettings_' + this.userId) || '{}');
        Object.assign(current, settings);
        localStorage.setItem('patientSettings_' + this.userId, JSON.stringify(current));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PatientDashboard();
});
