const API_BASE = window.location.origin + '/api';

class Auth {
    constructor() {
        this.init();
    }

    init() {
        // Check if we're already logged in
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            // If we have credentials but are on login page, redirect to dashboard
            if (window.location.pathname === '/') {
                window.location.href = '/dashboard';
            }
            return;
        }
        
        this.bindEvents();
    }

    bindEvents() {
        $('#loginForm').on('submit', (e) => this.handleLogin(e));
        $('#registerForm').on('submit', (e) => this.handleRegister(e));
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = $('#loginEmail').val();
        const password = $('#loginPassword').val();

        // Show loading state
        const submitBtn = $('#loginForm button[type="submit"]');
        const originalText = submitBtn.text();
        submitBtn.prop('disabled', true).text('Logging in...');

        try {
            console.log('Attempting login...');
            const response = await $.ajax({
                url: `${API_BASE}/auth/login`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ email, password })
            });

            console.log('Login response:', response);
            
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            this.showAlert('Login successful! Redirecting...', 'success');
            
            // Short delay to show success message
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
            
        } catch (error) {
            console.error('Login error details:', error);
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.responseJSON && error.responseJSON.error) {
                errorMessage = error.responseJSON.error;
            } else if (error.status === 0) {
                errorMessage = 'Cannot connect to server. Please check if the backend is running.';
            }
            
            this.showAlert(errorMessage, 'danger');
        } finally {
            // Restore button state
            submitBtn.prop('disabled', false).text(originalText);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const username = $('#registerUsername').val();
        const email = $('#registerEmail').val();
        const password = $('#registerPassword').val();

        // Basic validation
        if (password.length < 6) {
            this.showAlert('Password must be at least 6 characters long.', 'warning');
            return;
        }

        // Show loading state
        const submitBtn = $('#registerForm button[type="submit"]');
        const originalText = submitBtn.text();
        submitBtn.prop('disabled', true).text('Registering...');

        try {
            const response = await $.ajax({
                url: `${API_BASE}/auth/register`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ username, email, password })
            });

            this.showAlert('Registration successful! Please login.', 'success');
            $('#registerForm')[0].reset();
            $('#login-tab').tab('show');
        } catch (error) {
            console.error('Registration error:', error);
            const errorMsg = error.responseJSON?.error || 'Registration failed. Please try again.';
            this.showAlert(errorMsg, 'danger');
        } finally {
            // Restore button state
            submitBtn.prop('disabled', false).text(originalText);
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
        
        $('.auth-card .card-body').prepend(alert);
        
        setTimeout(() => {
            alert.alert('close');
        }, 5000);
    }
}

// Initialize auth when document is ready
$(document).ready(() => {
    new Auth();
});