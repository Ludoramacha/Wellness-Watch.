class Auth {
    constructor() {
        this.init();
    }

    init() {
        this.setupTabSwitching();
        this.setupFormHandlers();
        this.checkAuthStatus();
    }

    setupTabSwitching() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
                
                e.target.classList.add('active');
                document.getElementById(`${tab}LoginForm`).classList.add('active');
            });
        });
    }

    setupFormHandlers() {
        const patientForm = document.getElementById('patientLoginForm');
        const clinicianForm = document.getElementById('clinicianLoginForm');
        
        if (patientForm) {
            patientForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('patientEmail').value;
                const password = document.getElementById('patientPassword').value;
                
                if (email && password) {
                    this.loginAsPatient(email);
                } else {
                    document.getElementById('patientMessage').textContent = 'Please fill in all fields';
                    document.getElementById('patientMessage').style.color = 'var(--fire-2)';
                }
            });
        }

        if (clinicianForm) {
            clinicianForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('clinicianEmail').value;
                const password = document.getElementById('clinicianPassword').value;
                
                if (email && password) {
                    this.loginAsClinic(email, password);
                } else {
                    document.getElementById('clinicianMessage').textContent = 'Please fill in all fields';
                    document.getElementById('clinicianMessage').style.color = 'var(--fire-2)';
                }
            });
        }
    }

    loginAsPatient(email) {
        try {
            const userId = 'patient_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('authRole', 'patient');
            localStorage.setItem('userId', userId);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('loginTime', new Date().toISOString());
            
            const msg = document.getElementById('patientMessage');
            msg.textContent = 'Signing in...';
            msg.style.color = '#4ade80';
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } catch (err) {
            console.error('Login error:', err);
            document.getElementById('patientMessage').textContent = 'Login failed. ' + err.message;
            document.getElementById('patientMessage').style.color = 'var(--red)';
        }
    }

    loginAsClinic(email, password) {
        try {
            const clinicianId = 'clinician_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('authRole', 'clinician');
            sessionStorage.setItem('clinicianId', clinicianId);
            sessionStorage.setItem('clinicianEmail', email);
            sessionStorage.setItem('loginTime', new Date().toISOString());
            
            const msg = document.getElementById('clinicianMessage');
            msg.textContent = 'Signing in...';
            msg.style.color = '#4ade80';
            
            setTimeout(() => {
                window.location.href = 'clinician.html';
            }, 500);
        } catch (err) {
            console.error('Login error:', err);
            document.getElementById('clinicianMessage').textContent = 'Login failed. ' + err.message;
            document.getElementById('clinicianMessage').style.color = 'var(--red)';
        }
    }

    checkAuthStatus() {
        const role = localStorage.getItem('authRole');
        const clinicRole = sessionStorage.getItem('authRole');
        
        if (role === 'patient' && window.location.pathname.includes('dashboard')) {
            return;
        } else if (clinicRole === 'clinician' && window.location.pathname.includes('clinician')) {
            return;
        }
    }

    static logout(role) {
        if (role === 'patient') {
            localStorage.removeItem('authRole');
            localStorage.removeItem('userId');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('loginTime');
        } else if (role === 'clinician') {
            sessionStorage.removeItem('authRole');
            sessionStorage.removeItem('clinicianId');
            sessionStorage.removeItem('loginTime');
        }
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Auth();
});
