const API_BASE = window.location.origin + '/api';

class Dashboard {
    constructor() {
        this.tasks = [];
        this.categories = [];
        this.currentView = 'dashboard';
        this.gamification = new Gamification(this);
        this.init();
    }

    init() {
        console.log('Dashboard initializing...');
        
        // Check authentication
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            console.log('No auth found, redirecting to login');
            window.location.href = '/';
            return;
        }

        try {
            this.user = JSON.parse(user);
            console.log('User:', this.user);
            this.bindEvents();
            this.loadData();
            this.showView('dashboard');
            $('#userName').text(this.user.username);
        } catch (error) {
            console.error('Dashboard init error:', error);
            this.logout();
        }
    }

    bindEvents() {
        console.log('Binding events...');
        
        // Navigation
        $('#dashboardTab').on('click', (e) => {
            e.preventDefault();
            this.showView('dashboard');
        });
        
        $('#tasksTab').on('click', (e) => {
            e.preventDefault();
            this.showView('tasks');
        });
        
        $('#addTaskTab').on('click', (e) => {
            e.preventDefault();
            this.showView('addTask');
        });
        
        $('#categoriesTab').on('click', (e) => {
            e.preventDefault();
            this.showView('categories');
        });
        
        $('#gamificationTab').on('click', (e) => {
            e.preventDefault();
            console.log('Gamification tab clicked');
            this.showView('gamification');
        });
        
        $('#logoutBtn').on('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Forms
        $('#addTaskForm').on('submit', (e) => this.handleAddTask(e));
        $('#saveCategoryBtn').on('click', () => this.handleAddCategory());
        $('#filterStatus').on('change', () => this.renderTasks());
    }

    async loadData() {
        console.log('Loading data...');
        try {
            await Promise.all([
                this.loadTasks(),
                this.loadCategories(),
                this.gamification.loadData()
            ]);
            this.updateStats();
            this.renderRecentTasks();
            this.renderTasks();
            this.renderCategories();
        } catch (error) {
            console.error('Load data error:', error);
        }
    }

    async loadTasks() {
        try {
            console.log('Loading tasks...');
            this.tasks = await this.apiCall('/tasks', 'GET');
            console.log('Tasks loaded:', this.tasks.length);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    }

    async loadCategories() {
        try {
            console.log('Loading categories...');
            this.categories = await this.apiCall('/categories', 'GET');
            this.populateCategorySelect();
            console.log('Categories loaded:', this.categories.length);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    populateCategorySelect() {
        const select = $('#taskCategory');
        select.empty();
        select.append('<option value="">No Category</option>');
        
        this.categories.forEach(category => {
            select.append(new Option(category.name, category.id));
        });
    }

    async handleAddTask(e) {
        e.preventDefault();
        console.log('Adding task...');
        
        const taskData = {
            title: $('#taskTitle').val().trim(),
            description: $('#taskDescription').val().trim(),
            priority: $('#taskPriority').val(),
            due_date: $('#taskDueDate').val() || null,
            category_id: $('#taskCategory').val() || null
        };

        if (!taskData.title) {
            this.showAlert('Task title is required', 'warning');
            return;
        }

        try {
            await this.apiCall('/tasks', 'POST', taskData);
            $('#addTaskForm')[0].reset();
            this.showAlert('Task added successfully!', 'success');
            await this.loadData();
            this.showView('tasks');
        } catch (error) {
            console.error('Add task error:', error);
            this.showAlert('Failed to add task', 'danger');
        }
    }

    async handleAddCategory() {
        const name = $('#categoryName').val().trim();
        const color = $('#categoryColor').val();

        if (!name) {
            this.showAlert('Category name is required', 'warning');
            return;
        }

        try {
            await this.apiCall('/categories', 'POST', { name, color });
            $('#categoryName').val('');
            $('#addCategoryModal').modal('hide');
            this.showAlert('Category added successfully!', 'success');
            await this.loadCategories();
        } catch (error) {
            console.error('Add category error:', error);
            this.showAlert('Failed to add category', 'danger');
        }
    }

    async updateTaskStatus(taskId, status) {
        console.log('Updating task status:', taskId, status);
        try {
            await this.apiCall(`/tasks/${taskId}`, 'PUT', { status });
            await this.loadData();
            this.showAlert('Task status updated!', 'success');
        } catch (error) {
            console.error('Update task error:', error);
            this.showAlert('Failed to update task', 'danger');
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            await this.apiCall(`/tasks/${taskId}`, 'DELETE');
            await this.loadData();
            this.showAlert('Task deleted successfully!', 'success');
        } catch (error) {
            console.error('Delete task error:', error);
            this.showAlert('Failed to delete task', 'danger');
        }
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const pendingTasks = this.tasks.filter(task => task.status === 'pending').length;
        const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
        const highPriorityTasks = this.tasks.filter(task => task.priority === 'high').length;

        $('#totalTasks').text(totalTasks);
        $('#pendingTasks').text(pendingTasks);
        $('#completedTasks').text(completedTasks);
        $('#highPriorityTasks').text(highPriorityTasks);
    }

    renderRecentTasks() {
        const container = $('#recentTasksList');
        const recentTasks = this.tasks.slice(0, 5);
        
        if (recentTasks.length === 0) {
            container.html('<p class="text-muted text-center">No tasks yet. Add your first task!</p>');
            return;
        }

        const tasksHtml = recentTasks.map(task => this.createTaskHtml(task)).join('');
        container.html(tasksHtml);
    }

    renderTasks() {
        const container = $('#tasksList');
        const statusFilter = $('#filterStatus').val();
        
        let filteredTasks = this.tasks;
        if (statusFilter !== 'all') {
            filteredTasks = this.tasks.filter(task => task.status === statusFilter);
        }

        if (filteredTasks.length === 0) {
            container.html('<p class="text-muted text-center">No tasks found.</p>');
            return;
        }

        const tasksHtml = filteredTasks.map(task => this.createTaskHtml(task, true)).join('');
        container.html(tasksHtml);
    }

    renderCategories() {
        const container = $('#categoriesList');
        
        if (this.categories.length === 0) {
            container.html('<p class="text-muted text-center">No categories yet.</p>');
            return;
        }

        const categoriesHtml = this.categories.map(category => `
            <div class="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                <div>
                    <span class="badge" style="background-color: ${category.color}">${category.name}</span>
                </div>
                <small class="text-muted">${this.tasks.filter(t => t.category_id === category.id).length} tasks</small>
            </div>
        `).join('');
        
        container.html(categoriesHtml);
    }

    createTaskHtml(task, showActions = false) {
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
        const categoryBadge = task.category_name ? 
            `<span class="badge" style="background-color: ${task.category_color}">${task.category_name}</span>` : '';
        
        return `
            <div class="task-card card mb-2 ${task.priority}-priority ${task.status === 'completed' ? 'task-completed' : ''}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="card-title mb-1">
                                ${task.status === 'completed' ? '<s>' : ''}
                                ${task.title}
                                ${task.status === 'completed' ? '</s>' : ''}
                            </h6>
                            ${task.description ? `<p class="card-text text-muted small mb-1">${task.description}</p>` : ''}
                            <div class="d-flex gap-2 align-items-center flex-wrap">
                                <small class="text-muted">Due: ${dueDate}</small>
                                ${categoryBadge}
                                <span class="badge bg-${this.getPriorityClass(task.priority)}">${task.priority}</span>
                            </div>
                        </div>
                        ${showActions ? `
                        <div class="btn-group btn-group-sm ms-2">
                            <button class="btn btn-outline-${task.status === 'completed' ? 'warning' : 'success'}" 
                                    onclick="dashboard.updateTaskStatus(${task.id}, '${task.status === 'completed' ? 'pending' : 'completed'}')">
                                <i class="bi bi-${task.status === 'completed' ? 'arrow-counterclockwise' : 'check'}"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="dashboard.deleteTask(${task.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getPriorityClass(priority) {
        const classes = {
            'high': 'danger',
            'medium': 'warning',
            'low': 'success'
        };
        return classes[priority] || 'secondary';
    }

    showView(viewName) {
        console.log('Showing view:', viewName);
        
        // Hide all content sections
        $('#dashboardContent, #tasksContent, #addTaskContent, #categoriesContent, #gamificationContent').hide();
        
        // Remove active class from all nav items
        $('.nav-link').removeClass('active');
        
        // Show selected content and update nav
        switch (viewName) {
            case 'dashboard':
                $('#dashboardContent').show();
                $('#dashboardTab').addClass('active');
                $('#pageTitle').text('Dashboard');
                break;
            case 'tasks':
                $('#tasksContent').show();
                $('#tasksTab').addClass('active');
                $('#pageTitle').text('All Tasks');
                break;
            case 'addTask':
                $('#addTaskContent').show();
                $('#addTaskTab').addClass('active');
                $('#pageTitle').text('Add New Task');
                break;
            case 'categories':
                $('#categoriesContent').show();
                $('#categoriesTab').addClass('active');
                $('#pageTitle').text('Categories');
                break;
            case 'gamification':
                $('#gamificationContent').show();
                $('#gamificationTab').addClass('active');
                $('#pageTitle').text('Gamification');
                // Load gamification data
                if (this.gamification) {
                    this.gamification.loadData();
                }
                break;
        }
        
        this.currentView = viewName;
    }

    logout() {
        console.log('Logging out...');
        // Simple logout - just clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const token = localStorage.getItem('token');
        
        try {
            const config = {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            if (data) {
                config.body = JSON.stringify(data);
            }

            const response = await fetch(API_BASE + endpoint, config);

            if (response.status === 401) {
                this.logout();
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (error.message === 'Unauthorized') {
                this.showAlert('Session expired. Please login again.', 'danger');
                this.logout();
            }
            throw error;
        }
    }

    showAlert(message, type) {
        // Remove existing alerts
        $('.alert').remove();
        
        const alert = $(`
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        
        $('.main-content').prepend(alert);
        
        setTimeout(() => {
            alert.alert('close');
        }, 5000);
    }
}

// Initialize dashboard when document is ready
let dashboard;
$(document).ready(() => {
    console.log('Document ready, initializing dashboard...');
    dashboard = new Dashboard();
});