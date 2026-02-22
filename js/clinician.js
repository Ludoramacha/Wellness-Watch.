class ClinicianView {
    constructor() {
        const role = sessionStorage.getItem('authRole');
        if (role !== 'clinician') {
            window.location.href = 'index.html';
            return;
        }

        this.clinicianId = sessionStorage.getItem('clinicianId');
        this.patients = [];
        this.allReadings = {};
        this.allAlerts = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPatients();
    }

    setupEventListeners() {
        document.getElementById('refreshPatientsBtn')?.addEventListener('click', () => {
            this.loadPatients();
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            Auth.logout('clinician');
        });
    }

    loadPatients() {
        this.generateMockPatients();
        this.displayPatients();
    }

    generateMockPatients() {
        const patientCount = 5;
        this.patients = [];

        for (let i = 0; i < patientCount; i++) {
            const patientId = 'patient_' + Math.random().toString(36).substr(2, 9);
            const readingsStored = localStorage.getItem('readings_' + patientId);
            const readings = readingsStored ? JSON.parse(readingsStored) : this.generateMockReadings();
            const alertsStored = localStorage.getItem('alerts_' + patientId);
            const alerts = alertsStored ? JSON.parse(alertsStored) : [];

            const latestReading = readings[readings.length - 1];
            const riskLevel = latestReading.systolic > 160 ? 'critical' : latestReading.systolic > 140 ? 'high' : latestReading.systolic > 130 ? 'elevated' : 'normal';

            this.patients.push({
                id: patientId,
                name: `Patient ${i + 1}`,
                phone: `+267 7${Math.floor(Math.random() * 9000000 + 1000000)}`,
                latestBP: `${latestReading.systolic}/${latestReading.diastolic}`,
                riskLevel: riskLevel,
                lastReading: latestReading.timestamp,
                lastAlert: alerts.length > 0 ? alerts[alerts.length - 1].timestamp : null,
                readings: readings,
                alerts: alerts
            });

            this.allReadings[patientId] = readings;
            this.allAlerts[patientId] = alerts;
        }

        this.patients.sort((a, b) => {
            const riskOrder = { critical: 0, high: 1, elevated: 2, normal: 3 };
            return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        });
    }

    generateMockReadings() {
        const readings = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            readings.push({
                id: 'reading_' + Math.random().toString(36).substr(2, 9),
                systolic: Math.floor(Math.random() * 60 + 100),
                diastolic: Math.floor(Math.random() * 40 + 65),
                pulse: Math.floor(Math.random() * 40 + 55),
                timestamp: date.toISOString(),
                status: Math.random() > 0.6 ? 'high' : 'normal'
            });
        }

        return readings;
    }

    displayPatients() {
        const container = document.getElementById('patients-list');

        container.innerHTML = this.patients.map(p => `
            <div class="patient-card ${p.riskLevel}" onclick="clinicianView.expandPatient('${p.id}')">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
                    <div>
                        <h4>${p.name}</h4>
                        <p style="font-size:12px;color:var(--text-3);">${this.maskPhone(p.phone)}</p>
                    </div>
                    <span class="risk-badge ${p.riskLevel}">${p.riskLevel.toUpperCase()}</span>
                </div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
                    <div>
                        <small style="color:var(--text-3);">Latest BP</small>
                        <div style="font-weight:600;font-size:18px;">${p.latestBP}</div>
                    </div>
                    <div>
                        <small style="color:var(--text-3);">Last Reading</small>
                        <div style="font-size:12px;">${this.timeAgo(new Date(p.lastReading))}</div>
                    </div>
                </div>

                <div style="display:flex;gap:8px;padding-top:12px;border-top:1px solid var(--border);">
                    <button class="btn-text" onclick="event.stopPropagation();clinicianView.markReviewed('${p.id}')">
                        <i class="fas fa-check"></i> Mark Reviewed
                    </button>
                    <button class="btn-text" onclick="event.stopPropagation();clinicianView.showDetails('${p.id}')">
                        <i class="fas fa-expand"></i> Details
                    </button>
                </div>

                <div id="details-${p.id}" class="patient-details" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid var(--border);">
                    <h5 style="margin-bottom:12px;">Reading History</h5>
                    <div id="history-${p.id}"></div>
                    
                    <h5 style="margin:16px 0 12px;">Alert Log</h5>
                    <div id="alerts-${p.id}"></div>
                </div>
            </div>
        `).join('');

        window.clinicianView = this;
    }

    expandPatient(patientId) {
        const detailsEl = document.getElementById(`details-${patientId}`);
        if (!detailsEl) return;

        if (detailsEl.style.display === 'none') {
            this.showDetails(patientId);
        } else {
            detailsEl.style.display = 'none';
        }
    }

    showDetails(patientId) {
        const readings = this.allReadings[patientId] || [];
        const alerts = this.allAlerts[patientId] || [];
        const detailsEl = document.getElementById(`details-${patientId}`);
        
        if (!detailsEl) return;

        const historyHtml = readings.slice(-7).reverse().map(r => `
            <div style="padding:8px;background:var(--surface-2);border-radius:8px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;">
                    <span>${r.systolic}/${r.diastolic} mmHg</span>
                    <small style="color:var(--text-3);">${new Date(r.timestamp).toLocaleString()}</small>
                </div>
            </div>
        `).join('');

        const alertsHtml = alerts.slice(-5).reverse().map(a => `
            <div style="padding:8px;background:var(--surface-2);border-radius:8px;margin-bottom:8px;border-left:3px solid var(--${a.severity === 'high' ? 'red' : 'yellow'});">
                <div style="display:flex;justify-content:space-between;">
                    <strong>${a.severity.toUpperCase()}</strong>
                    <small>${new Date(a.timestamp).toLocaleString()}</small>
                </div>
                <p style="font-size:12px;margin-top:4px;">${a.message}</p>
            </div>
        `).join('');

        document.getElementById(`history-${patientId}`).innerHTML = historyHtml || '<p class="empty-state">No data</p>';
        document.getElementById(`alerts-${patientId}`).innerHTML = alertsHtml || '<p class="empty-state">No alerts</p>';
        document.getElementById(`details-${patientId}`).style.display = 'block';
    }

    markReviewed(patientId) {
        const alerts = this.allAlerts[patientId] || [];
        alerts.forEach(a => a.acknowledged = true);
        localStorage.setItem('alerts_' + patientId, JSON.stringify(alerts));
        
        alert(`Patient alerts marked as reviewed`);
    }

    maskPhone(phone) {
        return phone.slice(0, -4) + '****';
    }

    timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [key, value] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / value);
            if (interval >= 1) {
                return `${interval} ${key}${interval > 1 ? 's' : ''} ago`;
            }
        }
        return 'Just now';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.clinicianView = new ClinicianView();
});
