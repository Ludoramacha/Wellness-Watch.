// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.signup-form');
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            // Update active tab
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update active form
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${tab}SignupForm`) {
                    form.classList.add('active');
                }
            });
            
            // Clear messages
            document.getElementById('patientMessage').textContent = '';
            document.getElementById('clinicianMessage').textContent = '';
        });
    });
    
    // Patient signup form submission
    document.getElementById('patientSignupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const messageEl = document.getElementById('patientMessage');
        
        // Simple validation
        const password = document.getElementById('patientPassword').value;
        const confirm = document.getElementById('patientConfirmPassword').value;
        const terms = document.getElementById('patientTerms').checked;
        
        if (!terms) {
            messageEl.textContent = 'Please agree to the Terms of Service';
            return;
        }
        
        if (password.length < 8) {
            messageEl.textContent = 'Password must be at least 8 characters';
            return;
        }
        
        if (password !== confirm) {
            messageEl.textContent = 'Passwords do not match';
            return;
        }
        
        messageEl.style.color = 'var(--green)';
        messageEl.textContent = 'Account created! Redirecting...';
        
        // Simulate redirect
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    });
    
    // Clinician signup form submission
    document.getElementById('clinicianSignupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const messageEl = document.getElementById('clinicianMessage');
        
        // Simple validation
        const password = document.getElementById('clinicianPassword').value;
        const confirm = document.getElementById('clinicianConfirmPassword').value;
        const terms = document.getElementById('clinicianTerms').checked;
        const verification = document.getElementById('clinicianVerification').checked;
        
        if (!terms || !verification) {
            messageEl.textContent = 'Please agree to all terms and confirm license verification';
            return;
        }
        
        if (password.length < 10) {
            messageEl.textContent = 'Password must be at least 10 characters';
            return;
        }
        
        if (password !== confirm) {
            messageEl.textContent = 'Passwords do not match';
            return;
        }
        
        messageEl.style.color = 'var(--green)';
        messageEl.textContent = 'Clinician account created! Redirecting to verification...';
        
        // Simulate redirect
        setTimeout(() => {
            window.location.href = 'clinician-dashboard.html';
        }, 1500);
    });
    
    // Social signup buttons (placeholder functionality)
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Social sign-up would be integrated here');
        });
    });
});
