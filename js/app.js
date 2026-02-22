// Main Application Bootstrap
class HealthHavenApp {
    constructor() {
        this.currentPage = 'home';
        this.quizResponses = {};
        this.currentQuestion = 1;
        this.totalQuestions = 8;
        this.init();
    }

    init() {
        // Initialize data service
        window.dataService = new DataService();
        
        // Setup event listeners
        this.setupNavigation();
        this.setupEventListeners();
        this.setupQuiz();
        
        // Load initial data
        this.loadInitialData();
        
        // Update dashboard if on dashboard page
        if (window.location.hash === '#dashboard') {
            setTimeout(() => this.showPage('dashboard'), 100);
        }
        
        // Register service worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .catch(err => console.log('ServiceWorker registration failed: ', err));
        }
    }

    setupNavigation() {
        // Handle hash-based routing
        window.addEventListener('hashchange', () => {
            const page = window.location.hash.substring(1) || 'home';
            this.showPage(page);
        });

        // Handle nav item clicks
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                window.location.hash = page;
            });
        });

        // Initial page load
        const initialPage = window.location.hash.substring(1) || 'home';
        this.showPage(initialPage);
    }

    showPage(page) {
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });

        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Show selected page
        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
            this.currentPage = page;
            
            // Initialize page-specific functionality
            this.initializePage(page);
        }
    }

    initializePage(page) {
        switch(page) {
            case 'home':
                this.setupHomePage();
                break;
            case 'quiz':
                this.loadQuizQuestion(1);
                break;
            case 'roadmap':
                this.loadRoadmap();
                break;
            case 'dashboard':
                window.dashboard?.loadDashboard();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    }

    setupHomePage() {
        // Setup roadmap preview clicks
        document.querySelectorAll('.roadmap-preview').forEach(card => {
            card.addEventListener('click', () => {
                const roadmap = card.getAttribute('data-roadmap');
                this.previewRoadmap(roadmap);
            });
        });

        // Start quiz button
        document.getElementById('startQuizBtn')?.addEventListener('click', () => {
            window.location.hash = 'quiz';
        });
    }

    previewRoadmap(roadmapId) {
        // Show roadmap preview modal
        const roadmap = roadmapsData[roadmapId];
        if (roadmap) {
            alert(`Preview of ${roadmap.title} roadmap.\n\nTake the quiz to get your personalized plan!`);
        }
    }

    setupQuiz() {
        document.getElementById('nextBtn')?.addEventListener('click', () => {
            if (this.currentQuestion < this.totalQuestions) {
                this.saveCurrentAnswer();
                this.currentQuestion++;
                this.loadQuizQuestion(this.currentQuestion);
            } else {
                this.completeQuiz();
            }
        });

        document.getElementById('prevBtn')?.addEventListener('click', () => {
            if (this.currentQuestion > 1) {
                this.saveCurrentAnswer();
                this.currentQuestion--;
                this.loadQuizQuestion(this.currentQuestion);
            }
        });
    }

    loadQuizQuestion(questionNumber) {
        this.currentQuestion = questionNumber;
        
        // Update progress
        const progress = ((questionNumber - 1) / this.totalQuestions) * 100;
        document.getElementById('quizProgress').style.width = `${progress}%`;
        document.getElementById('currentQuestion').textContent = questionNumber;
        
        // Update buttons
        document.getElementById('prevBtn').disabled = questionNumber === 1;
        document.getElementById('nextBtn').textContent = 
            questionNumber === this.totalQuestions ? 'Complete' : 'Next';
        
        // Load question content
        const quizContent = document.getElementById('quiz-content');
        quizContent.innerHTML = this.getQuestionHTML(questionNumber);
        
        // Load saved answer if exists
        const savedAnswer = this.quizResponses[`q${questionNumber}`];
        if (savedAnswer) {
            const optionBtn = document.querySelector(`.option-btn[data-value="${savedAnswer}"]`);
            if (optionBtn) {
                optionBtn.classList.add('selected');
            }
        }
        
        // Setup option selection
        this.setupOptionSelection();
    }

    getQuestionHTML(questionNumber) {
        const questions = [
            {
                text: "What's your main health goal right now?",
                options: [
                    { value: "stress", label: "Reduce stress / feel less overwhelmed" },
                    { value: "endurance", label: "Train for a 5K / 10K / marathon" },
                    { value: "blood-pressure", label: "Improve blood pressure / reduce medication risk" },
                    { value: "prevention", label: "Lose weight / improve metabolic health" },
                    { value: "reversal", label: "Reverse/improve a health condition" },
                    { value: "management", label: "Manage an existing health condition" },
                    { value: "optimization", label: "Optimize my overall health" },
                    { value: "other", label: "Other" }
                ]
            },
            {
                text: "How active are you right now?",
                options: [
                    { value: "sedentary", label: "Sedentary (mostly sitting)" },
                    { value: "light", label: "Light (walking 1-2 times per week)" },
                    { value: "moderate", label: "Moderate (exercise 3-4 times per week)" },
                    { value: "active", label: "Active (exercise 5+ times per week)" }
                ]
            },
            {
                text: "What's your biggest barrier?",
                options: [
                    { value: "motivation", label: "Motivation" },
                    { value: "time", label: "Time" },
                    { value: "knowledge", label: "Knowledge" },
                    { value: "tools", label: "Tools/Equipment" },
                    { value: "stress", label: "Stress" }
                ]
            },
            {
                text: "Do you use a smartwatch / tracker?",
                options: [
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" }
                ]
            },
            {
                text: "Any diagnosed conditions?",
                options: [
                    { value: "hypertension", label: "Hypertension" },
                    { value: "diabetes", label: "Diabetes" },
                    { value: "cholesterol", label: "High Cholesterol" },
                    { value: "obesity", label: "Obesity" },
                    { value: "none", label: "None" },
                    { value: "prefer-not", label: "Prefer not to say" }
                ]
            },
            {
                text: "How much time can you commit daily?",
                options: [
                    { value: "5-10", label: "5-10 minutes" },
                    { value: "10-30", label: "10-30 minutes" },
                    { value: "30+", label: "30+ minutes" }
                ]
            },
            {
                text: "Which NEWSTART area do you struggle with most?",
                options: [
                    { value: "nutrition", label: "Nutrition" },
                    { value: "exercise", label: "Exercise" },
                    { value: "water", label: "Water" },
                    { value: "sunshine", label: "Sunshine" },
                    { value: "temperance", label: "Temperance" },
                    { value: "air", label: "Air/Fresh Air" },
                    { value: "rest", label: "Rest" },
                    { value: "trust", label: "Trust/Spiritual" }
                ]
            },
            {
                text: "Where do you live? (We'll use this for local tips)",
                options: [
                    { value: "gaborone", label: "Gaborone" },
                    { value: "francistown", label: "Francistown" },
                    { value: "maun", label: "Maun" },
                    { value: "kasane", label: "Kasane" },
                    { value: "other", label: "Other location in Botswana" },
                    { value: "outside", label: "Outside Botswana" }
                ]
            }
        ];

        const question = questions[questionNumber - 1];
        let html = `
            <div class="question-card">
                <h3 class="question-text">${question.text}</h3>
                <div class="options-grid">
        `;

        question.options.forEach(option => {
            html += `
                <button class="option-btn" data-value="${option.value}">
                    ${option.label}
                </button>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    setupOptionSelection() {
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove selected from all options
                document.querySelectorAll('.option-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Add selected to clicked option
                btn.classList.add('selected');
            });
        });
    }

    saveCurrentAnswer() {
        const selectedOption = document.querySelector('.option-btn.selected');
        if (selectedOption) {
            this.quizResponses[`q${this.currentQuestion}`] = selectedOption.getAttribute('data-value');
        }
    }

    completeQuiz() {
        this.saveCurrentAnswer();
        
        // Assign roadmap based on quiz responses
        const assignment = window.quizEngine.assignRoadmap(this.quizResponses);
        
        // Save to localStorage
        window.dataService.saveQuizResponse({
            responses: this.quizResponses,
            assignment: assignment,
            timestamp: new Date().toISOString()
        });
        
        // Save as active roadmap
        window.dataService.saveActiveRoadmap(assignment.roadmapId);
        
        // Show roadmap page
        window.location.hash = 'roadmap';
    }

    loadRoadmap() {
        const roadmapId = window.dataService.getActiveRoadmap();
        const quizResponse = window.dataService.getQuizResponse();
        
        if (!roadmapId || !roadmapId.roadmapId) {
            // Show roadmap selector
            document.getElementById('roadmap-selector').style.display = 'block';
            this.showRoadmapSelector();
            return;
        }
        
        const roadmap = roadmapsData[roadmapId.roadmapId];
        if (!roadmap) return;
        
        const content = document.getElementById('roadmap-content');
        content.innerHTML = this.generateRoadmapHTML(roadmap, quizResponse);
        
        // Setup week activation
        this.setupWeekActivation();
    }

    generateRoadmapHTML(roadmap, quizResponse) {
        const location = quizResponse?.responses?.q8 || 'Botswana';
        const localTips = window.localization.getLocalTips(location);
        
        let html = `
            <div class="roadmap-header">
                <h2>${roadmap.title} Roadmap</h2>
                <p class="roadmap-subtitle">Your personalized 4-week plan</p>
            </div>
            
            <div class="story-brand-section card">
                <h3>Your Wellness Story</h3>
                <div class="story-brand-content">
                    <div class="story-point">
                        <h4>The Problem</h4>
                        <p>${roadmap.storyBrand.problem}</p>
                    </div>
                    <div class="story-point">
                        <h4>The Guide</h4>
                        <p>${roadmap.storyBrand.guide}</p>
                    </div>
                    <div class="story-point">
                        <h4>The Plan</h4>
                        <ul>
                            ${roadmap.storyBrand.plan.map(step => `<li>${step}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="newstart-section card">
                <h3>NEWSTART Daily Habits</h3>
                <div class="newstart-grid">
                    ${Object.entries(roadmap.newstart).map(([key, value]) => `
                        <div class="newstart-item">
                            <div class="newstart-icon ${key}">
                                <i class="fas fa-${this.getNewstartIcon(key)}"></i>
                            </div>
                            <h4>${this.capitalizeFirst(key)}</h4>
                            <p>${value}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="weeks-section">
                <h3>Weekly Milestones</h3>
                <div class="weeks-grid">
        `;
        
        roadmap.weeks.forEach((week, index) => {
            const isActive = window.dataService.getActiveWeekIndex() === index;
            html += `
                <div class="week-card ${isActive ? 'active' : ''}" data-week="${index}">
                    <div class="week-header">
                        <h4>Week ${week.week}</h4>
                        <span class="week-title">${week.title}</span>
                    </div>
                    <div class="week-habits">
                        <p><strong>Key Habits:</strong></p>
                        <ul>
                            ${week.habits.slice(0, 3).map(habit => 
                                `<li>${habit.title} (${habit.estMinutes} min)</li>`
                            ).join('')}
                        </ul>
                    </div>
                    <button class="btn-${isActive ? 'secondary' : 'primary'} activate-week-btn" 
                            data-week="${index}">
                        ${isActive ? 'Active' : 'Activate This Week'}
                    </button>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
            
            <div class="local-tips-section card">
                <h3>Local Tips for ${location}</h3>
                <div class="tips-grid">
                    ${localTips.map(tip => `
                        <div class="tip-card">
                            <i class="fas fa-${tip.icon}"></i>
                            <h4>${tip.title}</h4>
                            <p>${tip.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="roadmap-actions">
                <button class="btn-primary" id="startDashboardBtn">
                    <i class="fas fa-play-circle"></i> Start My Dashboard
                </button>
                <button class="btn-secondary" id="saveRoadmapBtn">
                    <i class="fas fa-download"></i> Save Roadmap PDF
                </button>
            </div>
        `;
        
        return html;
    }

    setupWeekActivation() {
        document.querySelectorAll('.activate-week-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const weekIndex = parseInt(btn.getAttribute('data-week'));
                window.dataService.saveActiveWeekIndex(weekIndex);
                alert(`Week ${weekIndex + 1} activated! Check your dashboard for today's habits.`);
                window.location.hash = 'dashboard';
            });
        });
        
        document.getElementById('startDashboardBtn')?.addEventListener('click', () => {
            window.location.hash = 'dashboard';
        });
    }

    loadProfile() {
        const quizResponse = window.dataService.getQuizResponse();
        const archives = window.dataService.getArchives();
        const settings = window.dataService.getSettings();
        
        // Update profile info
        if (quizResponse) {
            document.getElementById('profileRoadmap').textContent = 
                `Following ${quizResponse.assignment?.roadmapId || 'Not set'} roadmap`;
            
            // Load quiz summary
            this.loadQuizSummary(quizResponse);
        }
        
        // Load history
        this.loadHistory(archives);
        
        // Load settings
        this.loadSettings(settings);
    }

    loadQuizSummary(quizResponse) {
        const container = document.getElementById('quiz-summary');
        if (!quizResponse) return;
        
        const responses = quizResponse.responses;
        let html = '<div class="quiz-summary-content">';
        
        for (let i = 1; i <= 8; i++) {
            const answer = responses[`q${i}`];
            if (answer) {
                html += `
                    <div class="quiz-summary-item">
                        <strong>Q${i}:</strong> ${answer}
                    </div>
                `;
            }
        }
        
        html += `
            <div class="quiz-assignment">
                <strong>Assigned Roadmap:</strong> ${quizResponse.assignment?.roadmapId}
            </div>
        </div>`;
        
        container.innerHTML = html;
    }

    loadHistory(archives) {
        const container = document.getElementById('history-list');
        if (!archives || archives.length === 0) {
            container.innerHTML = '<p class="empty-state">No saved days yet.</p>';
            return;
        }
        
        let html = '<div class="history-list">';
        archives.slice(0, 10).forEach(archive => {
            const date = new Date(archive.date).toLocaleDateString();
            html += `
                <div class="history-item card">
                    <div class="history-date">${date}</div>
                    <div class="history-progress">
                        <span class="progress-badge">${archive.percentCompleted}%</span>
                        ${archive.completedHabits.length} habits completed
                    </div>
                    <button class="btn-text view-history-btn" data-date="${archive.date}">
                        View Details
                    </button>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    loadSettings(settings) {
        // Set toggle states
        document.getElementById('aiOptInToggle').checked = settings?.aiOptIn || false;
        document.getElementById('notificationsToggle').checked = settings?.notifications || false;
        document.getElementById('shareLinksToggle').checked = settings?.shareLinks || false;
    }

    setupEventListeners() {
        // AI Chat FAB
        document.getElementById('aiChatFab')?.addEventListener('click', () => {
            this.showAiChat();
        });
        
        // Close AI Chat
        document.getElementById('closeAiChat')?.addEventListener('click', () => {
            this.hideAiChat();
        });
        
        // Privacy Modal
        document.getElementById('privacyModalBtn')?.addEventListener('click', () => {
            this.showPrivacyModal();
        });
        
        document.getElementById('closePrivacyModal')?.addEventListener('click', () => {
            this.hidePrivacyModal();
        });
        
        // Settings toggles
        document.getElementById('aiOptInToggle')?.addEventListener('change', (e) => {
            window.dataService.updateSettings({ aiOptIn: e.target.checked });
        });
        
        document.getElementById('notificationsToggle')?.addEventListener('change', (e) => {
            window.dataService.updateSettings({ notifications: e.target.checked });
        });
        
        document.getElementById('shareLinksToggle')?.addEventListener('change', (e) => {
            window.dataService.updateSettings({ shareLinks: e.target.checked });
        });
    }

    showAiChat() {
        document.getElementById('aiChatModal').classList.add('active');
        // Initialize AI chat
        window.aiAdapter?.initializeChat();
    }

    hideAiChat() {
        document.getElementById('aiChatModal').classList.remove('active');
    }

    showPrivacyModal() {
        document.getElementById('privacyModal').classList.add('active');
    }

    hidePrivacyModal() {
        document.getElementById('privacyModal').classList.remove('active');
    }

    loadInitialData() {
        // Check for morning micro-step
        this.checkForMorningMicrostep();
    }

    checkForMorningMicrostep() {
        const now = new Date();
        const hours = now.getHours();
        const settings = window.dataService.getSettings();
        
        // Show micro-step between 5 AM and 9 AM if AI is enabled
        if (settings?.aiOptIn && hours >= 5 && hours <= 9) {
            const lastShown = window.dataService.getLastMicrostepShown();
            const today = now.toDateString();
            
            if (lastShown !== today) {
                // Show micro-step after a delay
                setTimeout(() => {
                    this.showDailyMicrostep();
                    window.dataService.setLastMicrostepShown(today);
                }, 2000);
            }
        }
    }

    showDailyMicrostep() {
        // This would show a non-modal micro-step card
        console.log('Showing daily micro-step');
        // Implementation would create and show a micro-step card
    }

    getNewstartIcon(key) {
        const icons = {
            nutrition: 'apple-alt',
            exercise: 'running',
            water: 'tint',
            sunshine: 'sun',
            temperance: 'balance-scale',
            air: 'wind',
            rest: 'bed',
            trust: 'heart'
        };
        return icons[key] || 'heart';
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HealthHavenApp();
});