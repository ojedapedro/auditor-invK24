// Aplicación principal
class App {
    static init() {
        console.log('Inicializando aplicación...');
        
        // Inicializar módulos en orden
        Utils.showNotification('Sistema de inventario cargado', 'info');
        
        Auth.init();
        Inventory.init();
        Scanner.init();
        Reports.init();
        History.init();
        UI.init();
        
        // Verificar autenticación
        this.checkAuthentication();
        
        // Configurar actualizaciones periódicas
        this.setupPeriodicUpdates();
        
        console.log('Aplicación inicializada correctamente');
    }
    
    static checkAuthentication() {
        if (Auth.isAuthenticated()) {
            Auth.showMainApp();
        } else {
            Auth.showLoginScreen();
        }
    }
    
    static setupPeriodicUpdates() {
        // Actualizar dashboard cada 2 segundos
        setInterval(() => {
            if (Auth.isAuthenticated() && UI.currentSection === 'dashboard') {
                this.refreshDashboard();
            }
        }, 2000);
    }
    
    static refreshDashboard() {
        const stats = Inventory.calculateStats();
        const config = Inventory.getConfig();
        
        // Actualizar estadísticas
        $('#total-theoretical').text(Utils.formatNumber(stats.totalTheoretical));
        $('#total-scanned').text(Utils.formatNumber(stats.totalScanned));
        $('#total-discrepancies').text(Utils.formatNumber(stats.discrepancies));
        $('#completion-rate').text(`${stats.completionRate}%`);
        
        // Actualizar contadores
        $('#scanned-count').text(Utils.formatNumber(stats.totalScanned));
        $('#remaining-count').text(Utils.formatNumber(stats.totalTheoretical - stats.totalScanned));
        
        // Actualizar barra de progreso
        const progressPercentage = stats.totalTheoretical > 0 ? 
            (stats.totalScanned / stats.totalTheoretical) * 100 : 0;
        UI.updateProgressBar(progressPercentage);
        
        // Actualizar información del inventario
        $('.inventory-date').text(config.date || 'No configurada');
        $('.inventory-store').text(config.store || 'No configurada');
        $('.inventory-responsible').text(config.responsible || 'No configurado');
        
        // Actualizar estado del escáner
        this.updateScannerStatus();
    }
    
    static updateScannerStatus() {
        const isScanning = Scanner.getScanningStatus();
        const scannedCount = Inventory.getScanned().length;
        
        if (isScanning) {
            $('#scanner-status').html('<span class="badge bg-success">Escaneando...</span>');
        } else {
            $('#scanner-status').html('<span class="badge bg-secondary">Inactivo</span>');
        }
        
        $('#total-scanned-items').text(scannedCount);
    }
    
    static exportData() {
        const data = {
            inventory: Inventory.getTheoretical(),
            scanned: Inventory.getScanned(),
            config: Inventory.getConfig(),
            history: History.getHistory(),
            exportDate: new Date().toISOString(),
            exportedBy: Auth.getUser()?.name || 'Unknown'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventario_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('Datos exportados correctamente', 'success');
    }
    
    static importData(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validar estructura de datos
                if (data.inventory && Array.isArray(data.inventory)) {
                    Inventory.theoretical = data.inventory;
                }
                if (data.scanned && Array.isArray(data.scanned)) {
                    Inventory.scanned = data.scanned;
                }
                if (data.config) {
                    Inventory.config = data.config;
                }
                if (data.history && Array.isArray(data.history)) {
                    History.inventoryHistory = data.history;
                }
                
                Inventory.saveToStorage();
                History.saveToStorage();
                
                Inventory.updateUI();
                Inventory.updateScannedTable();
                History.updateHistoryTable();
                
                Utils.showNotification('Datos importados correctamente', 'success');
            } catch (error) {
                Utils.showNotification('Error al importar datos: formato inválido', 'error');
            }
        };
        
        reader.readAsText(file);
    }
}

// Inicializar aplicación cuando el DOM esté listo
$(document).ready(() => {
    App.init();
});

// Manejar errores no capturados
window.addEventListener('error', (event) => {
    console.error('Error no capturado:', event.error);
    Utils.showNotification('Ocurrió un error inesperado. Por favor, recargue la página.', 'error');
});