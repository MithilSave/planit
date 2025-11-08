class Gamification {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.stats = null;
        this.achievements = [];
        console.log('Gamification class initialized');
    }

    async loadData() {
        console.log('Gamification: Loading data...');
        try {
            await Promise.all([
                this.loadStats(),
                this.loadAchievements()
            ]);
            console.log('Gamification: Data loaded successfully');
        } catch (error) {
            console.error('Gamification load error:', error);
        }
    }

    async loadStats() {
        try {
            console.log('Gamification: Loading stats...');
            this.stats = await this.dashboard.apiCall('/gamification/stats', 'GET');
            console.log('Gamification: Stats loaded:', this.stats);
            this.updateStatsUI();
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    async loadAchievements() {
        try {
            console.log('Gamification: Loading achievements...');
            this.achievements = await this.dashboard.apiCall('/gamification/achievements', 'GET');
            console.log('Gamification: Achievements loaded:', this.achievements.length);
            this.updateAchievementsUI();
        } catch (error) {
            console.error('Failed to load achievements:', error);
        }
    }

    updateStatsUI() {
        if (!this.stats) {
            console.log('Gamification: No stats to update');
            return;
        }

        console.log('Gamification: Updating stats UI with:', this.stats);
        
        // Update the gamification stats cards
        $('#userPoints').text(this.stats.total_points || 0);
        $('#userLevel').text(this.stats.current_level || 1);
        $('#userStreak').text(this.stats.current_streak || 0);
        $('#tasksCompleted').text(this.stats.tasks_completed || 0);
        $('#achievementsCount').text(this.stats.achievements_count || 0);

        // Update level progress
        const progress = ((this.stats.total_points || 0) % 100);
        $('#levelProgress').css('width', `${progress}%`).text(`${progress}%`);
        
        console.log('Gamification: Stats UI updated');
    }

    updateAchievementsUI() {
        const container = $('#achievementsList');
        console.log('Gamification: Updating achievements UI');
        
        if (!this.achievements || this.achievements.length === 0) {
            console.log('Gamification: No achievements to display');
            container.html('<p class="text-muted text-center">No achievements found. Complete tasks to earn achievements!</p>');
            return;
        }

        console.log('Gamification: Processing', this.achievements.length, 'achievements');

        const earned = this.achievements.filter(a => a.earned);
        const locked = this.achievements.filter(a => !a.earned);

        let html = '';

        // Earned achievements section
        if (earned.length > 0) {
            html += '<h5>🎉 Earned Achievements</h5><div class="row mb-4">';
            earned.forEach(achievement => {
                html += this.createAchievementCard(achievement, true);
            });
            html += '</div>';
        }

        // Locked achievements section
        if (locked.length > 0) {
            html += '<h5>🔒 Available Achievements</h5><div class="row">';
            locked.forEach(achievement => {
                html += this.createAchievementCard(achievement, false);
            });
            html += '</div>';
        }

        // Fallback if no achievements at all
        if (earned.length === 0 && locked.length === 0) {
            html = '<p class="text-muted text-center">No achievements available.</p>';
        }

        console.log('Gamification: Setting achievements HTML');
        container.html(html);
    }

    createAchievementCard(achievement, isEarned) {
        const progress = this.getProgress(achievement);
        
        return `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100 ${isEarned ? 'border-success' : 'opacity-75'}">
                    <div class="card-body text-center">
                        <i class="bi ${achievement.icon || 'bi-trophy'} display-6" 
                           style="color: ${achievement.color || '#ffd700'}"></i>
                        <h6 class="card-title mt-2">${achievement.name}</h6>
                        <p class="card-text small text-muted">${achievement.description}</p>
                        <div class="progress mb-2" style="height: 8px;">
                            <div class="progress-bar ${isEarned ? 'bg-success' : 'bg-secondary'}" 
                                 style="width: ${isEarned ? '100%' : progress}%"></div>
                        </div>
                        ${isEarned ? 
                            '<span class="badge bg-success">✅ Earned</span>' :
                            `<small class="text-muted">Progress: ${progress}%</small>`
                        }
                    </div>
                </div>
            </div>
        `;
    }

    getProgress(achievement) {
        if (!this.stats) return 0;

        let current = 0;
        switch (achievement.criteria_type) {
            case 'tasks_completed':
                current = this.stats.tasks_completed || 0;
                break;
            case 'streak':
                current = this.stats.current_streak || 0;
                break;
            case 'points':
                current = this.stats.total_points || 0;
                break;
            case 'level':
                current = this.stats.current_level || 1;
                break;
            default:
                current = 0;
        }

        const target = achievement.criteria_value || 1;
        const progress = Math.min(100, Math.round((current / target) * 100));
        return progress;
    }
}