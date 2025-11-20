// Módulo de autenticación
class Auth {
    static currentUser = null;
    
    static init() {
        this.loadUser();
        this.setupEventListeners();
    }
    
    static setupEventListeners() {
        $(document).on('submit', '#login-form', (e) => this.handleLogin(e));
        $(document).on('click', '#logout-btn', (e) => {
            e.preventDefault();
            this.handleLogout();
        });
    }
    
    static handleLogin(e) {
        e.preventDefault();
        
        const email = $('#email').val();
        const password = $('#password').val();
        
        if (!this.validateLogin(email, password)) {
            return;
        }
        
        // Simulación de login exitoso
        this.currentUser = {
            id: Utils.generateId(),
            email: email,
            name: email.split('@')[0],
            loginTime: new Date().toISOString()
        };
        
        this.saveUser();
        this.showMainApp();
        Utils.showNotification('¡Bienvenido! Sesión iniciada correctamente', 'success');
    }
    
    static validateLogin(email, password) {
        if (!email || !password) {
            Utils.showNotification('Por favor, complete todos los campos', 'warning');
            return false;
        }
        
        if (!Utils.isValidEmail(email)) {
            Utils.showNotification('Por favor, ingrese un email válido', 'warning');
            return false;
        }
        
        // En una aplicación real, aquí se verificaría con el backend
        if (password.length < 3) {
            Utils.showNotification('La contraseña debe tener al menos 3 caracteres', 'warning');
            return false;
        }
        
        return true;
    }
    
    static handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLoginScreen();
        Utils.showNotification('Sesión cerrada correctamente', 'info');
    }
    
    static saveUser() {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }
    
    static loadUser() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }
    
    static showMainApp() {
        $('#login-screen').addClass('d-none');
        $('#main-app').removeClass('d-none');
        $('#user-name').text(this.currentUser.name);
        
        // Cargar dashboard por defecto
        UI.loadSection('dashboard');
    }
    
    static showLoginScreen() {
        $('#main-app').addClass('d-none');
        $('#login-screen').removeClass('d-none');
        Utils.clearForm('login-form');
    }
    
    static isAuthenticated() {
        return this.currentUser !== null;
    }
    
    static getUser() {
        return this.currentUser;
    }
}