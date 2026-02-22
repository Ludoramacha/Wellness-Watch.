// ============================================================
// AURA — Dashboard
// ============================================================
class Dashboard {
    constructor() {
        this.currentDate = new Date();
        this.bpChart = null;

        this.domElements = {
            todayDate:      document.getElementById('todayDate'),
            bpValue:        document.getElementById('bpValue'),
            bpStatus:       document.getElementById('bpStatus'),
            bpTime:         document.getElementById('bpTime'),
            bpPulse:        document.getElementById('bpPulse'),
            readingsList:   document.getElementById('readings-list'),
            alertsList:     document.getElementById('alerts-list'),
            bpChart:        document.getElementById('bpChart'),
        };

        this.init();
    }

    // ----------------------------------------------------------
    // INIT
    // ----------------------------------------------------------
    init() {
        this.updateDateDisplay();
        this.setupEventListeners();
        addDashboardStyles();
    }

    // ----------------------------------------------------------
    // MAIN LOAD — called by app.js whenever dashboard page opens
    // ----------------------------------------------------------
    async loadDashboard() {
        await Promise.all([
            this.loadReadings(),
            this.loadAlerts()
        ]);
    }

    // ----------------------------------------------------------
    // BP READINGS
    // ----------------------------------------------------------
    async loadReadings() {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            this.showEmptyState('readings-list', 'Connect your wearable on the home page to see readings.');
            return;
        }

        try {
            const res = await fetch(`/api/users/${userId}/readings`);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);

            const readings = await res.json();

            if (!readings || readings.length === 0) {
                this.showEmptyState('readings-list', 'No readings yet. Wear your device and sync.');
                this.clearLatestCard();
                return;
            }

            // Latest reading card
            this.renderLatestReading(readings[0]);

            // Chart
            this.renderBpChart(readings);

            // Readings list
            this.renderReadingsList(readings);

        } catch (err) {
            console.error('Load readings error:', err);
            this.showEmptyState('readings-list', 'Failed to load readings. Check your connection.');
        }
    }

    renderLatestReading(reading) {
        const { systolic, diastolic, pulse, timestamp } = reading;
        const statusLabel = this.getBpStatusLabel(systolic, diastolic);
        const statusClass = this.getBpStatusClass(systolic, diastolic);

        if (this.domElements.bpValue)
            this.domElements.bpValue.textContent = `${systolic}/${diastolic}`;

        if (this.domElements.bpStatus) {
            this.domElements.bpStatus.textContent = statusLabel;
            this.domElements.bpStatus.className = `bp-status badge ${statusClass}`;
        }

        if (this.domElements.bpTime)
            this.domElements.bpTime.textContent = new Date(timestamp).toLocaleString();

        if (this.domElements.bpPulse)
            this.domElements.bpPulse.textContent = pulse ? `${pulse} bpm` : '-- bpm';
    }

    clearLatestCard() {
        if (this.domElements.bpValue)  this.domElements.bpValue.textContent  = '--/--';
        if (this.domElements.bpStatus) this.domElements.bpStatus.textContent = '—';
        if (this.domElements.bpTime)   this.domElements.bpTime.textContent   = '';
        if (this.domElements.bpPulse)  this.domElements.bpPulse.textContent  = '-- bpm';
    }

    renderReadingsList(readings) {
        const container = this.domElements.readingsList;
        if (!container) return;

        container.innerHTML = readings.map(r => `
            <div class="reading-item card">
                <div class="reading-bp">
                    <span class="bp-value-sm">${r.systolic}/${r.diastolic}</span>
                    <span class="bp-unit">mmHg</span>
                </div>
                <div class="reading-meta">
                    <span class="badge ${this.getBpStatusClass(r.systolic, r.diastolic)}">
                        ${this.getBpStatusLabel(r.systolic, r.diastolic)}
                    </span>
                    ${r.pulse ? `<span class="reading-pulse"><i class="fas fa-heart"></i> ${r.pulse} bpm</span>` : ''}
                </div>
                <div class="reading-time">${new Date(r.timestamp).toLocaleString()}</div>
            </div>
        `).join('');
    }

    // ----------------------------------------------------------
    // CHART
    // ----------------------------------------------------------
    renderBpChart(readings) {
        const canvas = this.domElements.bpChart;
        if (!canvas || typeof Chart === 'undefined') return;

        // Destroy previous instance if exists
        if (this.bpChart) {
            this.bpChart.destroy();
        }

        // Take latest 10, reverse so oldest is on left
        const data = [...readings].slice(0, 10).reverse();

        const labels    = data.map(r => new Date(r.timestamp).toLocaleDateString());
        const systolic  = data.map(r => r.systolic);
        const diastolic = data.map(r => r.diastolic);

        this.bpChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Systolic',
                        data: systolic,
                        borderColor: '#F47A1F',
                        backgroundColor: 'rgba(244,122,31,0.1)',
                        tension: 0.3,
                        fill: false,
                        pointRadius: 5,
                    },
                    {
                        label: 'Diastolic',
                        data: diastolic,
                        borderColor: '#2E87D6',
                        backgroundColor: 'rgba(46,135,214,0.1)',
                        tension: 0.3,
                        fill: false,
                        pointRadius: 5,
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y} mmHg`
                        }
                    }
                },
                scales: {
                    y: {
                        min: 50,
                        max: 200,
                        title: { display: true, text: 'mmHg' }
                    }
                }
            }
        });
    }

    // ----------------------------------------------------------
    // ALERTS
    // ----------------------------------------------------------
    async loadAlerts() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const res = await fetch(`/api/users/${userId}/alerts`);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);

            const alerts = await res.json();

            if (!alerts || alerts.length === 0) {
                this.showEmptyState('alerts-list', 'No alerts sent yet.');
                return;
            }

            this.renderAlertsList(alerts);

        } catch (err) {
            console.error('Load alerts error:', err);
            this.showEmptyState('alerts-list', 'Failed to load alerts.');
        }
    }

    renderAlertsList(alerts) {
        const container = this.domElements.alertsList;
        if (!container) return;

        container.innerHTML = alerts.map(a => `
            <div class="alert-item card">
                <div class="alert-icon">
                    <i class="fab fa-whatsapp"></i>
                </div>
                <div class="alert-content">
                    <p class="alert-message">${a.message || 'BP Alert sent'}</p>
                    <span class="alert-time">${new Date(a.sentAt || a.timestamp).toLocaleString()}</span>
                </div>
                <span class="badge ${a.delivered ? 'status-normal' : 'status-elevated'}">
                    ${a.delivered ? 'Delivered' : 'Pending'}
                </span>
            </div>
        `).join('');
    }

    // ----------------------------------------------------------
    // EVENT LISTENERS
    // ----------------------------------------------------------
    setupEventListeners() {
        document.getElementById('refreshReadingsBtn')?.addEventListener('click', () => {
            this.loadDashboard();
            this.showToast('Refreshing readings…', 'info');
        });
    }

    // ----------------------------------------------------------
    // UTILITIES
    // ----------------------------------------------------------
    updateDateDisplay() {
        const el = this.domElements.todayDate;
        if (!el) return;
        el.textContent = this.currentDate.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    showEmptyState(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<p class="empty-state">${message}</p>`;
        }
    }

    getBpStatusLabel(systolic, diastolic) {
        if (systolic > 180 || diastolic > 120) return 'Crisis';
        if (systolic >= 140 || diastolic >= 90)  return 'High Stage 2';
        if (systolic >= 130 || diastolic >= 80)  return 'High Stage 1';
        if (systolic >= 120 && diastolic < 80)   return 'Elevated';
        return 'Normal';
    }

    getBpStatusClass(systolic, diastolic) {
        if (systolic > 180 || diastolic > 120) return 'status-crisis';
        if (systolic >= 140 || diastolic >= 90)  return 'status-high2';
        if (systolic >= 130 || diastolic >= 80)  return 'status-high1';
        if (systolic >= 120 && diastolic < 80)   return 'status-elevated';
        return 'status-normal';
    }

    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    showToast(message, type = 'info') {
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.parentNode?.removeChild(toast), 300);
        }, 3000);
    }

    getToastIcon(type) {
        return { success: 'check-circle', error: 'exclamation-circle',
                 warning: 'exclamation-triangle', info: 'info-circle' }[type] || 'info-circle';
    }

    showCelebration(message) {
        const el = document.createElement('div');
        el.className = 'celebration';
        el.innerHTML = `<div class="celebration-content"><i class="fas fa-star"></i><span>${message}</span></div>`;
        document.body.appendChild(el);
        setTimeout(() => el.classList.add('show'), 100);
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.parentNode?.removeChild(el), 500);
        }, 2100);
    }
}

// ----------------------------------------------------------
// DYNAMIC STYLES
// ----------------------------------------------------------
function addDashboardStyles() {
    if (document.getElementById('aura-dashboard-styles')) return;

    const styles = `
        /* BP Latest Card */
        .bp-latest-card {
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #fff;
            border-radius: var(--radius-lg, 16px);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .bp-reading {
            display: flex;
            align-items: baseline;
            justify-content: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        .bp-value { font-size: 3rem; font-weight: 700; letter-spacing: -1px; }
        .bp-unit  { font-size: 1rem; opacity: 0.7; }
        .bp-meta  { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 0.5rem; }
        .bp-time  { font-size: 0.8rem; opacity: 0.6; }
        .bp-pulse { font-size: 0.9rem; opacity: 0.8; }
        .bp-pulse i { color: #ff6b6b; margin-right: 4px; }

        /* BP Status badges */
        .badge { padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
        .status-normal   { background: #d4edda; color: #155724; }
        .status-elevated { background: #fff3cd; color: #856404; }
        .status-high1    { background: #ffe0b2; color: #e65100; }
        .status-high2    { background: #ffccbc; color: #bf360c; }
        .status-crisis   { background: #ffcdd2; color: #b71c1c; }
        .status-unknown  { background: #e0e0e0; color: #424242; }

        /* Reading items */
        .reading-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 1rem;
            margin-bottom: 0.5rem;
            border-radius: var(--radius-md, 10px);
            background: var(--white, #fff);
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .reading-item .bp-value-sm { font-size: 1.3rem; font-weight: 700; }
        .reading-item .bp-unit     { font-size: 0.75rem; color: #888; }
        .reading-meta  { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .reading-pulse { font-size: 0.8rem; color: #888; }
        .reading-time  { font-size: 0.75rem; color: #aaa; margin-left: auto; }

        /* Alert items */
        .alert-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 1rem;
            margin-bottom: 0.5rem;
            border-radius: var(--radius-md, 10px);
            background: var(--white, #fff);
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .alert-icon { font-size: 1.5rem; color: #25d366; }
        .alert-content { flex: 1; }
        .alert-message { font-size: 0.9rem; margin: 0; }
        .alert-time    { font-size: 0.75rem; color: #aaa; }

        /* Patient cards (clinician) */
        .patient-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            margin-bottom: 0.5rem;
            border-radius: var(--radius-md, 10px);
            background: var(--white, #fff);
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .patient-info  { display: flex; align-items: center; gap: 0.75rem; }
        .patient-reading { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .avatar.small  { width: 36px; height: 36px; font-size: 0.75rem; border-radius: 50%;
                         background: var(--hh-orange, #F47A1F); color: #fff;
                         display: flex; align-items: center; justify-content: center; font-weight: 700; }

        /* Chart section */
        .chart-section { margin-bottom: 1.5rem; }
        .chart-section h3 { margin-bottom: 0.75rem; }

        /* Section headers */
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }

        /* Empty state */
        .empty-state { text-align: center; padding: 2rem 1rem; color: #aaa; font-size: 0.9rem; }

        /* Toast */
        .toast {
            position: fixed; top: 20px; right: 20px;
            background: #fff; border-radius: 10px;
            padding: 0.75rem 1rem; box-shadow: 0 4px 16px rgba(0,0,0,0.12);
            z-index: 3000; transform: translateX(120%); opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease; max-width: 300px;
        }
        .toast.show { transform: translateX(0); opacity: 1; }
        .toast-content { display: flex; align-items: center; gap: 0.5rem; }
        .toast-success { border-left: 4px solid #7AC143; }
        .toast-error   { border-left: 4px solid #ff6b6b; }
        .toast-warning { border-left: 4px solid #ffa500; }
        .toast-info    { border-left: 4px solid #F47A1F; }

        /* Celebration */
        .celebration {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%) scale(0);
            background: linear-gradient(135deg, #F47A1F, #7AC143);
            color: #fff; padding: 1.5rem 2rem; border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            z-index: 3001; text-align: center; transition: transform 0.3s ease;
        }
        .celebration.show { transform: translate(-50%, -50%) scale(1); }
        .celebration-content { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
        .celebration-content i { font-size: 2.5rem; }

        @media (max-width: 768px) {
            .toast { left: 16px; right: 16px; max-width: none; }
            .patient-card { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'aura-dashboard-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// ----------------------------------------------------------
// EXPORT & INIT
// ----------------------------------------------------------
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
} else {
    window.Dashboard = Dashboard;
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
