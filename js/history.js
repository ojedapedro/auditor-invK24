// Módulo de historial
class History {
    static inventoryHistory = [];
    
    static init() {
        this.loadFromStorage();
        this.setupEventListeners();
    }
    
    static setupEventListeners() {
        $(document).on('click', '#finalize-inventory-btn', () => this.showFinalizeModal());
        $(document).on('click', '#confirm-finalize-btn', () => this.finalizeInventory());
        $(document).on('click', '.view-history', function() {
            const id = $(this).data('id');
            History.viewHistory(id);
        });
    }
    
    static showFinalizeModal() {
        const theoretical = Inventory.getTheoretical();
        if (theoretical.length === 0) {
            Utils.showNotification('No hay inventario para finalizar. Primero configure y cargue un inventario teórico.', 'warning');
            return;
        }
        
        $('#finalizeInventoryModal').modal('show');
    }
    
    static finalizeInventory() {
        const generateReport = $('#generate-final-report').is(':checked');
        
        if (generateReport) {
            Reports.generatePDF();
            // Pequeño delay para asegurar que el PDF se genere antes de limpiar
            setTimeout(() => {
                this.completeFinalization();
            }, 1000);
        } else {
            this.completeFinalization();
        }
    }
    
    static completeFinalization() {
        this.saveCurrentInventory();
        this.clearCurrentInventory();
        $('#finalizeInventoryModal').modal('hide');
        
        Utils.showNotification('Inventario finalizado correctamente. Los datos han sido guardados en el historial.', 'success');
    }
    
    static saveCurrentInventory() {
        const theoretical = Inventory.getTheoretical();
        const scanned = Inventory.getScanned();
        const config = Inventory.getConfig();
        
        if (theoretical.length === 0) return;
        
        const stats = Inventory.calculateStats();
        
        const inventoryRecord = {
            id: Utils.generateId(),
            date: config.date || new Date().toISOString().split('T')[0],
            store: config.store || 'Tienda no especificada',
            responsible: config.responsible || 'Responsable no especificado',
            totalItems: theoretical.length,
            totalTheoretical: stats.totalTheoretical,
            totalScanned: stats.totalScanned,
            discrepancies: stats.discrepancies,
            completionRate: stats.completionRate,
            timestamp: new Date().toISOString(),
            data: {
                theoretical: JSON.parse(JSON.stringify(theoretical)),
                scanned: JSON.parse(JSON.stringify(scanned))
            }
        };
        
        this.inventoryHistory.push(inventoryRecord);
        
        // Mantener solo los últimos 5 inventarios
        if (this.inventoryHistory.length > 5) {
            this.inventoryHistory = this.inventoryHistory.slice(-5);
        }
        
        this.saveToStorage();
        this.updateHistoryTable();
    }
    
    static clearCurrentInventory() {
        // Limpiar datos actuales
        Inventory.theoretical = [];
        Inventory.scanned = [];
        Inventory.config = {};
        
        // Resetear UI
        $('#excel-file').val('');
        $('#inventory-setup-form')[0].reset();
        Inventory.updateUI();
        Inventory.updateScannedTable();
        Scanner.updateRecentScans();
        
        // Guardar cambios
        Inventory.saveToStorage();
        App.refreshDashboard();
    }
    
    static updateHistoryTable() {
        const tableBody = $('#history-table-body');
        tableBody.empty();
        
        if (this.inventoryHistory.length === 0) {
            tableBody.append(`
                <tr>
                    <td colspan="7" class="text-center text-muted">No hay historial de inventarios</td>
                </tr>
            `);
            return;
        }
        
        const recentHistory = [...this.inventoryHistory].reverse().slice(0, 5);
        
        recentHistory.forEach(inventory => {
            tableBody.append(`
                <tr>
                    <td>${Utils.formatDate(inventory.date)}</td>
                    <td>${inventory.store}</td>
                    <td>${inventory.responsible}</td>
                    <td>${inventory.totalItems}</td>
                    <td>${inventory.totalScanned}</td>
                    <td>${inventory.discrepancies}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary view-history" data-id="${inventory.id}">
                            <i class="fas fa-eye me-1"></i>Ver
                        </button>
                    </td>
                </tr>
            `);
        });
    }
    
    static viewHistory(id) {
        const inventory = this.inventoryHistory.find(i => i.id === id);
        if (inventory) {
            // En una aplicación real, aquí se cargarían los datos del inventario
            // Por ahora mostramos un resumen
            const message = `
                <strong>Inventario del ${Utils.formatDate(inventory.date)}</strong><br>
                <strong>Tienda:</strong> ${inventory.store}<br>
                <strong>Responsable:</strong> ${inventory.responsible}<br>
                <strong>Total de items:</strong> ${inventory.totalItems}<br>
                <strong>Items escaneados:</strong> ${inventory.totalScanned}<br>
                <strong>Discrepancias:</strong> ${inventory.discrepancies}<br>
                <strong>Tasa de completitud:</strong> ${inventory.completionRate}%
            `;
            
            Utils.showNotification(message, 'info');
        }
    }
    
    static saveToStorage() {
        localStorage.setItem('inventoryHistory', JSON.stringify(this.inventoryHistory));
    }
    
    static loadFromStorage() {
        try {
            const savedHistory = localStorage.getItem('inventoryHistory');
            if (savedHistory) {
                this.inventoryHistory = JSON.parse(savedHistory);
                this.updateHistoryTable();
            }
        } catch (error) {
            console.error('Error loading history from storage:', error);
            this.inventoryHistory = [];
        }
    }
    
    static getHistory() {
        return this.inventoryHistory;
    }
}