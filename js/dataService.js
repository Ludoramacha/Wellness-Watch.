/**
 Health Haven Data Service
 * LocalStorage wrapper with data migration support
 * Single source of truth for all app data
 */

class DataService {
    constructor() {
        this.STORAGE_KEY = 'healthHaven_v1';
        this.DEFAULT_DATA = {
            version: '1.0.0',
            quizResponse: null,
            activeRoadmap: null,
            activeWeekIndex: 0,
            dailyProgress: {},
            archives: [],
            settings: {
                aiOptIn: false,
                notifications: true,
                shareLinks: false,
                theme: 'light',
                lastMicrostepShown: null,
                createdAt: new Date().toISOString(),
                tone: 'neutral' // 'neutral' or 'faith'
            }
        };
        
        this.init();
    }

    /**
     * Initialize data service
     * Checks for existing data and runs migrations if needed
     */
    init() {
        this.migrateFromLegacy();
        this.ensureDataStructure();
    }

    /**
     * Ensure data structure exists and is valid
     */
    ensureDataStructure() {
        let data = this.getData();
        
        if (!data) {
            // Initialize with default data
            this.setData(this.DEFAULT_DATA);
            return;
        }

        // Ensure all required keys exist
        let needsUpdate = false;
        for (const [key, defaultValue] of Object.entries(this.DEFAULT_DATA)) {
            if (data[key] === undefined) {
                data[key] = defaultValue;
                needsUpdate = true;
            }
        }

        // Ensure settings structure
        if (!data.settings) {
            data.settings = this.DEFAULT_DATA.settings;
            needsUpdate = true;
        } else {
            for (const [key, defaultValue] of Object.entries(this.DEFAULT_DATA.settings)) {
                if (data.settings[key] === undefined) {
                    data.settings[key] = defaultValue;
                    needsUpdate = true;
                }
            }
        }

        if (needsUpdate) {
            this.setData(data);
        }
    }

    /**
     * Migrate from legacy storage formats
     */
    migrateFromLegacy() {
        // Check for older versions and migrate if needed
        const legacyKeys = [
            'healthHaven_data',
            'hh_quiz_results',
            'hh_user_data'
        ];

        legacyKeys.forEach(key => {
            const legacyData = localStorage.getItem(key);
            if (legacyData) {
                try {
                    const parsed = JSON.parse(legacyData);
                    console.log(`Migrating from legacy key: ${key}`);
                    
                    // Map legacy data to new structure
                    if (key === 'healthHaven_data') {
                        this.migrateFromV0(parsed);
                    } else if (key === 'hh_quiz_results') {
                        this.migrateQuizResults(parsed);
                    }
                    
                    // Clean up legacy data
                    localStorage.removeItem(key);
                } catch (error) {
                    console.error(`Failed to migrate from ${key}:`, error);
                }
            }
        });
    }

    /**
     * Migrate from version 0 data structure
     */
    migrateFromV0(oldData) {
        const currentData = this.getData() || this.DEFAULT_DATA;
        
        // Map old data to new structure
        if (oldData.quiz) {
            currentData.quizResponse = {
                responses: oldData.quiz,
                assignment: oldData.roadmapAssignment,
                timestamp: oldData.quizTimestamp || new Date().toISOString()
            };
        }

        if (oldData.activeRoadmap) {
            currentData.activeRoadmap = oldData.activeRoadmap;
        }

        if (oldData.activeWeek !== undefined) {
            currentData.activeWeekIndex = oldData.activeWeek;
        }

        if (oldData.progress) {
            currentData.dailyProgress = oldData.progress;
        }

        if (oldData.history) {
            currentData.archives = oldData.history;
        }

        this.setData(currentData);
    }

    /**
     * Migrate quiz results
     */
    migrateQuizResults(quizData) {
        const currentData = this.getData() || this.DEFAULT_DATA;
        
        currentData.quizResponse = {
            responses: quizData,
            timestamp: new Date().toISOString()
        };

        this.setData(currentData);
    }

    /**
     * Get entire data object
     */
    getData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    /**
     * Set entire data object
     */
    setData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    }

    /**
     * Save quiz response
     */
    saveQuizResponse(quizResponse) {
        const data = this.getData() || this.DEFAULT_DATA;
        data.quizResponse = quizResponse;
        return this.setData(data);
    }

    /**
     * Get quiz response
     */
    getQuizResponse() {
        const data = this.getData();
        return data?.quizResponse || null;
    }

    /**
     * Save active roadmap
     */
    saveActiveRoadmap(roadmapId) {
        const data = this.getData() || this.DEFAULT_DATA;
        data.activeRoadmap = roadmapId;
        return this.setData(data);
    }

    /**
     * Get active roadmap
     */
    getActiveRoadmap() {
        const data = this.getData();
        return data?.activeRoadmap || null;
    }

    /**
     * Save active week index
     */
    saveActiveWeekIndex(weekIndex) {
        const data = this.getData() || this.DEFAULT_DATA;
        data.activeWeekIndex = weekIndex;
        return this.setData(data);
    }

    /**
     * Get active week index
     */
    getActiveWeekIndex() {
        const data = this.getData();
        return data?.activeWeekIndex || 0;
    }

    /**
     * Save daily progress for a specific date
     */
    saveDailyProgress(date, progressData) {
        const data = this.getData() || this.DEFAULT_DATA;
        
        if (!data.dailyProgress) {
            data.dailyProgress = {};
        }
        
        data.dailyProgress[date] = {
            ...progressData,
            date: date,
            updatedAt: new Date().toISOString()
        };
        
        return this.setData(data);
    }

    /**
     * Get daily progress for a specific date
     */
    getDailyProgress(date) {
        const data = this.getData();
        return data?.dailyProgress?.[date] || null;
    }

    /**
     * Get all daily progress
     */
    getAllDailyProgress() {
        const data = this.getData();
        return data?.dailyProgress || {};
    }

    /**
     * Get today's progress
     */
    getTodayProgress() {
        const today = this.getTodayDateString();
        return this.getDailyProgress(today);
    }

    /**
     * Update habit completion for today
     */
    updateHabitCompletion(habitId, completed) {
        const today = this.getTodayDateString();
        const progress = this.getTodayProgress() || {
            completedHabits: [],
            customHabits: [],
            mood: null,
            waterGlasses: 0,
            percentCompleted: 0,
            date: today
        };

        if (completed) {
            // Add habit if not already in list
            if (!progress.completedHabits.includes(habitId)) {
                progress.completedHabits.push(habitId);
            }
        } else {
            // Remove habit from list
            progress.completedHabits = progress.completedHabits.filter(id => id !== habitId);
        }

        // Recalculate percentage (will be calculated by dashboard)
        return this.saveDailyProgress(today, progress);
    }

    /**
     * Add custom habit for today
     */
    addCustomHabit(habit) {
        const today = this.getTodayDateString();
        const progress = this.getTodayProgress() || {
            completedHabits: [],
            customHabits: [],
            mood: null,
            waterGlasses: 0,
            percentCompleted: 0,
            date: today
        };

        const habitId = `custom_${Date.now()}`;
        const customHabit = {
            id: habitId,
            title: habit.title,
            tag: habit.tag || 'custom',
            estMinutes: habit.estMinutes || 5,
            completed: false
        };

        progress.customHabits.push(customHabit);
        return this.saveDailyProgress(today, progress);
    }

    /**
     * Update water intake for today
     */
    updateWaterIntake(glasses) {
        const today = this.getTodayDateString();
        const progress = this.getTodayProgress() || {
            completedHabits: [],
            customHabits: [],
            mood: null,
            waterGlasses: 0,
            percentCompleted: 0,
            date: today
        };

        progress.waterGlasses = Math.max(0, Math.min(8, glasses));
        return this.saveDailyProgress(today, progress);
    }

    /**
     * Update mood for today
     */
    updateMood(mood) {
        const today = this.getTodayDateString();
        const progress = this.getTodayProgress() || {
            completedHabits: [],
            customHabits: [],
            mood: null,
            waterGlasses: 0,
            percentCompleted: 0,
            date: today
        };

        progress.mood = mood;
        return this.saveDailyProgress(today, progress);
    }

    /**
     * Save day to archives
     */
    saveDayToArchive() {
        const today = this.getTodayDateString();
        const progress = this.getTodayProgress();
        
        if (!progress) {
            return false;
        }

        const data = this.getData() || this.DEFAULT_DATA;
        
        if (!data.archives) {
            data.archives = [];
        }

        // Remove existing entry for today if exists
        data.archives = data.archives.filter(archive => archive.date !== today);
        
        // Add new entry
        const archiveEntry = {
            ...progress,
            savedAt: new Date().toISOString(),
            saved: true
        };
        
        data.archives.unshift(archiveEntry); // Add to beginning
        
        // Keep only last 100 entries
        if (data.archives.length > 100) {
            data.archives = data.archives.slice(0, 100);
        }

        return this.setData(data);
    }

    /**
     * Get archives
     */
    getArchives() {
        const data = this.getData();
        return data?.archives || [];
    }

    /**
     * Get specific archive by date
     */
    getArchiveByDate(date) {
        const archives = this.getArchives();
        return archives.find(archive => archive.date === date);
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        const data = this.getData() || this.DEFAULT_DATA;
        
        data.settings = {
            ...data.settings,
            ...newSettings,
            updatedAt: new Date().toISOString()
        };
        
        return this.setData(data);
    }

    /**
     * Get settings
     */
    getSettings() {
        const data = this.getData();
        return data?.settings || this.DEFAULT_DATA.settings;
    }

    /**
     * Set AI opt-in status
     */
    setAiOptIn(optIn) {
        return this.updateSettings({ aiOptIn: optIn });
    }

    /**
     * Get AI opt-in status
     */
    getAiOptIn() {
        const settings = this.getSettings();
        return settings.aiOptIn || false;
    }

    /**
     * Set last micro-step shown date
     */
    setLastMicrostepShown(date) {
        return this.updateSettings({ lastMicrostepShown: date });
    }

    /**
     * Get last micro-step shown date
     */
    getLastMicrostepShown() {
        const settings = this.getSettings();
        return settings.lastMicrostepShown;
    }

    /**
     * Get streak count
     */
    getStreakCount() {
        const progress = this.getAllDailyProgress();
        const dates = Object.keys(progress).sort();
        
        if (dates.length === 0) return 0;
        
        let streak = 0;
        let currentDate = new Date();
        
        // Check consecutive days from today backwards
        for (let i = 0; i < 365; i++) { // Check up to 1 year
            const dateStr = this.formatDate(currentDate);
            const dayProgress = progress[dateStr];
            
            if (dayProgress && dayProgress.percentCompleted >= 50) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }

    /**
     * Get weekly progress for active week
     */
    getWeeklyProgress() {
        const activeWeekIndex = this.getActiveWeekIndex();
        const today = new Date();
        const startOfWeek = this.getStartOfWeek(today);
        
        let completedHabits = 0;
        let totalPossibleHabits = 0;
        const daysInWeekSoFar = Math.min(today.getDay() + 1, 7); // 1-7
        
        // Get roadmap habits for active week
        const activeRoadmap = this.getActiveRoadmap();
        let weeklyHabits = [];
        
        if (activeRoadmap && window.roadmapsData && window.roadmapsData[activeRoadmap]) {
            const roadmap = window.roadmapsData[activeRoadmap];
            if (roadmap.weeks[activeWeekIndex]) {
                weeklyHabits = roadmap.weeks[activeWeekIndex].habits;
            }
        }
        
        const totalHabitsPerDay = weeklyHabits.length;
        
        // Calculate progress for each day this week
        for (let i = 0; i < daysInWeekSoFar; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateStr = this.formatDate(date);
            const dayProgress = this.getDailyProgress(dateStr);
            
            if (dayProgress) {
                completedHabits += dayProgress.completedHabits.length;
            }
            totalPossibleHabits += totalHabitsPerDay;
        }
        
        return {
            completedHabits,
            totalPossibleHabits,
            percentage: totalPossibleHabits > 0 ? Math.round((completedHabits / totalPossibleHabits) * 100) : 0
        };
    }

    /**
     * Export all data as JSON
     */
    exportAllData() {
        const data = this.getData() || this.DEFAULT_DATA;
        return {
            ...data,
            exportedAt: new Date().toISOString(),
            appVersion: '1.0.0'
        };
    }

    /**
     * Import data from JSON
     */
    importData(importedData) {
        try {
            // Validate imported data structure
            if (!importedData || typeof importedData !== 'object') {
                throw new Error('Invalid data format');
            }
            
            // Merge with defaults to ensure structure
            const mergedData = {
                ...this.DEFAULT_DATA,
                ...importedData,
                settings: {
                    ...this.DEFAULT_DATA.settings,
                    ...(importedData.settings || {})
                },
                importedAt: new Date().toISOString()
            };
            
            return this.setData(mergedData);
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Clear all data
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            
            // Also clear any legacy keys
            const legacyKeys = [
                'healthHaven_data',
                'hh_quiz_results',
                'hh_user_data'
            ];
            
            legacyKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Reinitialize with defaults
            this.setData(this.DEFAULT_DATA);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    /**
     * Get storage usage info
     */
    getStorageInfo() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            const size = data ? new Blob([data]).size : 0;
            const archives = this.getArchives();
            
            return {
                totalSize: size,
                archivesCount: archives.length,
                dailyProgressCount: Object.keys(this.getAllDailyProgress()).length,
                quizCompleted: !!this.getQuizResponse(),
                activeRoadmap: this.getActiveRoadmap(),
                lastUpdated: this.getLastUpdated()
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }

    /**
     * Get last updated timestamp
     */
    getLastUpdated() {
        const data = this.getData();
        return data?.settings?.updatedAt || data?.settings?.createdAt;
    }

    /**
     * Test data service integrity
     */
    testIntegrity() {
        const tests = {
            storageAccessible: !!localStorage,
            dataStructure: !!this.getData(),
            settings: !!this.getSettings(),
            defaultValues: true
        };

        // Test each method
        try {
            const today = this.getTodayDateString();
            this.saveDailyProgress(today, { test: true });
            tests.saveProgress = true;
            
            const progress = this.getDailyProgress(today);
            tests.getProgress = !!progress;
            
            this.updateHabitCompletion('test_habit', true);
            tests.habitUpdate = true;
            
            const streak = this.getStreakCount();
            tests.streakCalculation = typeof streak === 'number';
            
            const weekly = this.getWeeklyProgress();
            tests.weeklyProgress = typeof weekly.percentage === 'number';
            
        } catch (error) {
            console.error('Test failed:', error);
            tests.methodTests = false;
        }

        return tests;
    }

    /**
     * Utility: Get today's date as YYYY-MM-DD
     */
    getTodayDateString() {
        return this.formatDate(new Date());
    }

    /**
     * Utility: Format date as YYYY-MM-DD
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Utility: Get start of week (Sunday)
     */
    getStartOfWeek(date) {
        const day = date.getDay();
        const diff = date.getDate() - day;
        const start = new Date(date);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        return start;
    }

    /**
     * Utility: Parse date string to Date object
     */
    parseDate(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    /**
     * Utility: Get readable date format
     */
    getReadableDate(dateStr) {
        const date = this.parseDate(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Debug method: Dump all data to console
     */
    dumpData() {
        const data = this.getData();
        console.log('=== Health Haven Data Dump ===');
        console.log('Storage Key:', this.STORAGE_KEY);
        console.log('Data Version:', data?.version || 'N/A');
        console.log('Quiz Completed:', !!data?.quizResponse);
        console.log('Active Roadmap:', data?.activeRoadmap || 'None');
        console.log('Active Week:', data?.activeWeekIndex + 1 || 1);
        console.log('Daily Progress Entries:', Object.keys(data?.dailyProgress || {}).length);
        console.log('Archives:', data?.archives?.length || 0);
        console.log('Settings:', data?.settings || {});
        console.log('Streak:', this.getStreakCount());
        console.log('==============================');
        return data;
    }

    /**
     * Debug method: Create sample data for testing
     */
    createSampleData() {
        const sampleData = {
            version: '1.0.0',
            quizResponse: {
                responses: {
                    q1: 'stress',
                    q2: 'sedentary',
                    q3: 'time',
                    q4: 'no',
                    q5: 'none',
                    q6: '10-30',
                    q7: 'rest',
                    q8: 'gaborone'
                },
                assignment: {
                    roadmapId: 'stress-reset',
                    intensity: 'standard',
                    personalisedTags: ['time-poor', 'beginner', 'stress-focus']
                },
                timestamp: new Date().toISOString()
            },
            activeRoadmap: 'stress-reset',
            activeWeekIndex: 0,
            dailyProgress: {},
            archives: [],
            settings: this.DEFAULT_DATA.settings
        };

        // Create 7 days of sample progress
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = this.formatDate(date);
            
            sampleData.dailyProgress[dateStr] = {
                date: dateStr,
                completedHabits: ['h1', 'h2', 'h3'].slice(0, Math.floor(Math.random() * 4)),
                customHabits: [],
                mood: ['happy', 'neutral', 'excited'][Math.floor(Math.random() * 3)],
                waterGlasses: Math.floor(Math.random() * 9),
                percentCompleted: Math.floor(Math.random() * 100)
            };
        }

        this.setData(sampleData);
        return sampleData;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataService;
} else {
    window.DataService = DataService;
}