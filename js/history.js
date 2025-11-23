// Módulo de historial
class History {
    static inventoryHistory = [];
    
    static init() {
        this.loadFromStorage();
        this.setupEventListeners();
    }
    
    // ... (los métodos setupEventListeners, showFinalizeModal, finalizeInventory permanecen iguales)
    
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
            observations: config.observations || '', // GUARDAR OBSERVACIONES EN EL HISTORIAL
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
    
    static viewHistory(id) {
        const inventory = this.inventoryHistory.find(i => i.id === id);
        if (inventory) {
            let message = `
                <strong>Inventario del ${Utils.formatDate(inventory.date)}</strong><br>
                <strong>Tienda:</strong> ${inventory.store}<br>
                <strong>Responsable:</strong> ${inventory.responsible}<br>
                <strong>Total de items:</strong> ${inventory.totalItems}<br>
                <strong>Items escaneados:</strong> ${inventory.totalScanned}<br>
                <strong>Discrepancias:</strong> ${inventory.discrepancies}<br>
                <strong>Tasa de completitud:</strong> ${inventory.completionRate}%
            `;
            
            // MOSTRAR OBSERVACIONES SI EXISTEN
            if (inventory.observations && inventory.observations.trim() !== '') {
                message += `<br><strong>Observaciones:</strong> ${inventory.observations}`;
            }
            
            Utils.showNotification(message, 'info');
        }
    }
    
    // ... (el resto de los métodos permanecen iguales)
}