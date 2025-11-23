// Módulo de gestión de inventario
class Inventory {
    static theoretical = [];
    static scanned = [];
    static config = {};
    
    static init() {
        this.loadFromStorage();
        this.setupEventListeners();
    }
    
    static setupEventListeners() {
        $(document).on('submit', '#inventory-setup-form', (e) => this.handleSetup(e));
        $(document).on('click', '#load-excel-btn', () => this.handleExcelLoad());
        $(document).on('click', '#clear-scanned-btn', () => this.clearScannedItems());
        
        // Eventos para edición de items
        $(document).on('click', '.edit-item', function() {
            const id = $(this).data('id');
            Inventory.editItem(id);
        });
        
        $(document).on('click', '.delete-item', function() {
            const id = $(this).data('id');
            Inventory.deleteItem(id);
        });
        
        $(document).on('click', '#save-edit-btn', () => this.saveEditedItem());
    }
    
    static handleSetup(e) {
        e.preventDefault();
        
        const date = $('#inventory-date-input').val();
        const store = $('#store-name').val();
        const responsible = $('#responsible-person').val();
        const observations = $('#inventory-observations').val(); // NUEVO CAMPO
        
        if (!date || !store || !responsible) {
            Utils.showNotification('Por favor, complete todos los campos', 'warning');
            return;
        }
        
        this.config = { date, store, responsible, observations }; // INCLUIR OBSERVACIONES
        this.saveToStorage();
        this.updateUI();
        
        Utils.showNotification('Configuración guardada correctamente', 'success');
    }
    
    // ... (el resto de los métodos permanecen iguales hasta updateUI)
    
    static updateUI() {
        if (this.config.date) {
            $('.inventory-date').text(this.config.date);
            $('#current-inventory-info').text(`Inventario: ${this.config.store} - ${this.config.date}`);
        }
        
        if (this.config.store) {
            $('.inventory-store').text(this.config.store);
        }
        
        if (this.config.responsible) {
            $('.inventory-responsible').text(this.config.responsible);
        }
        
        // ACTUALIZAR OBSERVACIONES
        if (this.config.observations) {
            $('#current-observations').text(this.config.observations);
            $('#inventory-observations').val(this.config.observations);
        } else {
            $('#current-observations').text('No especificadas');
            $('#inventory-observations').val('');
        }
        
        // Actualizar contador de productos
        $('#loaded-products-count').text(this.theoretical.length);
    }
    
    // ... (el resto de los métodos permanecen iguales)
}