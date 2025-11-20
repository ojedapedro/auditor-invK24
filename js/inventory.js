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
        
        if (!date || !store || !responsible) {
            Utils.showNotification('Por favor, complete todos los campos', 'warning');
            return;
        }
        
        this.config = { date, store, responsible };
        this.saveToStorage();
        this.updateUI();
        
        Utils.showNotification('Configuración guardada correctamente', 'success');
    }
    
    static handleExcelLoad() {
        const fileInput = document.getElementById('excel-file');
        if (fileInput.files.length === 0) {
            Utils.showNotification('Por favor, seleccione un archivo Excel', 'warning');
            return;
        }
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                this.theoretical = this.processExcelData(jsonData);
                this.saveToStorage();
                this.updateExcelPreview();
                
                Utils.showNotification(`Inventario teórico cargado: ${this.theoretical.length} productos`, 'success');
            } catch (error) {
                console.error('Error processing Excel:', error);
                Utils.showNotification('Error al procesar el archivo Excel. Verifique el formato.', 'error');
            }
        };
        
        reader.onerror = () => {
            Utils.showNotification('Error al leer el archivo', 'error');
        };
        
        reader.readAsArrayBuffer(file);
    }
    
    static processExcelData(jsonData) {
        return jsonData.map(item => {
            // Normalizar nombres de columnas
            const code = item.Código || item.codigo || item.CODIGO || item.ID || item.SKU || '';
            const name = item.Producto || item.producto || item.PRODUCTO || item.Nombre || item.nombre || item.Descripción || '';
            const quantity = item.Cantidad || item.cantidad || item.CANTIDAD || item.Stock || item.stock || 0;
            
            return {
                id: Utils.generateId(),
                code: code.toString().trim(),
                name: name.toString().trim(),
                theoreticalQuantity: parseInt(quantity) || 0,
                scannedQuantity: 0
            };
        }).filter(item => item.code && item.name); // Filtrar items vacíos
    }
    
    static updateExcelPreview() {
        const previewBody = $('#excel-preview-body');
        previewBody.empty();
        
        const previewItems = this.theoretical.slice(0, 5);
        
        if (previewItems.length === 0) {
            previewBody.append('<tr><td colspan="3" class="text-center">No hay datos para mostrar</td></tr>');
            return;
        }
        
        previewItems.forEach(item => {
            previewBody.append(`
                <tr>
                    <td>${item.code}</td>
                    <td>${item.name}</td>
                    <td>${item.theoreticalQuantity}</td>
                </tr>
            `);
        });
        
        if (this.theoretical.length > 5) {
            previewBody.append(`
                <tr>
                    <td colspan="3" class="text-center text-muted">... y ${this.theoretical.length - 5} productos más</td>
                </tr>
            `);
        }
        
        $('#excel-preview').show();
    }
    
    static clearScannedItems() {
        if (confirm('¿Está seguro de que desea eliminar todos los productos escaneados?')) {
            this.scanned = [];
            // Resetear cantidades escaneadas en inventario teórico
            this.theoretical.forEach(item => item.scannedQuantity = 0);
            this.saveToStorage();
            this.updateScannedTable();
            Utils.showNotification('Productos escaneados eliminados', 'info');
        }
    }
    
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
    }
    
    static saveToStorage() {
        localStorage.setItem('theoreticalInventory', JSON.stringify(this.theoretical));
        localStorage.setItem('scannedItems', JSON.stringify(this.scanned));
        localStorage.setItem('inventoryConfig', JSON.stringify(this.config));
    }
    
    static loadFromStorage() {
        try {
            const savedTheoretical = localStorage.getItem('theoreticalInventory');
            const savedScanned = localStorage.getItem('scannedItems');
            const savedConfig = localStorage.getItem('inventoryConfig');
            
            if (savedTheoretical) this.theoretical = JSON.parse(savedTheoretical);
            if (savedScanned) this.scanned = JSON.parse(savedScanned);
            if (savedConfig) {
                this.config = JSON.parse(savedConfig);
                this.updateUI();
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
            this.theoretical = [];
            this.scanned = [];
            this.config = {};
        }
    }
    
    // Métodos para gestión de items escaneados
    static addScannedItem(barcode) {
        if (!barcode.trim()) return false;
        
        let item = this.theoretical.find(i => i.code === barcode);
        
        if (item) {
            const existingIndex = this.scanned.findIndex(i => i.code === barcode);
            
            if (existingIndex !== -1) {
                // Incrementar cantidad
                this.scanned[existingIndex].scannedQuantity += 1;
                item.scannedQuantity += 1;
            } else {
                // Agregar nuevo item
                const newItem = {
                    id: Utils.generateId(),
                    code: item.code,
                    name: item.name,
                    theoreticalQuantity: item.theoreticalQuantity,
                    scannedQuantity: 1
                };
                
                this.scanned.push(newItem);
                item.scannedQuantity = 1;
            }
            
            this.saveToStorage();
            return true;
        } else {
            // Producto no encontrado en inventario teórico
            const newItem = {
                id: Utils.generateId(),
                code: barcode,
                name: 'Producto no identificado',
                theoreticalQuantity: 0,
                scannedQuantity: 1
            };
            
            this.scanned.push(newItem);
            this.saveToStorage();
            return false;
        }
    }
    
    static updateScannedTable() {
        const tableBody = $('#scanned-items-table tbody');
        tableBody.empty();
        
        if (this.scanned.length === 0) {
            tableBody.append(`
                <tr>
                    <td colspan="7" class="text-center text-muted">No hay productos escaneados</td>
                </tr>
            `);
            return;
        }
        
        this.scanned.forEach(item => {
            const difference = item.scannedQuantity - item.theoreticalQuantity;
            const status = difference === 0 ? 'Correcto' : 
                          difference > 0 ? 'Exceso' : 'Faltante';
            
            const statusClass = difference === 0 ? 'success' : 
                              difference > 0 ? 'warning' : 'danger';
            
            tableBody.append(`
                <tr>
                    <td>${item.code}</td>
                    <td>${item.name}</td>
                    <td>${item.theoreticalQuantity}</td>
                    <td>${item.scannedQuantity}</td>
                    <td>${difference}</td>
                    <td><span class="badge bg-${statusClass}">${status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-item" data-id="${item.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-item" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `);
        });
        
        // Inicializar DataTable si existe
        if ($.fn.DataTable.isDataTable('#scanned-items-table')) {
            $('#scanned-items-table').DataTable().destroy();
        }
        
        $('#scanned-items-table').DataTable({
            pageLength: 10,
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json'
            },
            order: [[0, 'asc']]
        });
    }
    
    static editItem(id) {
        const item = this.scanned.find(i => i.id === id);
        if (item) {
            $('#edit-item-id').val(item.id);
            $('#edit-item-code').val(item.code);
            $('#edit-item-name').val(item.name);
            $('#edit-item-quantity').val(item.scannedQuantity);
            
            $('#editItemModal').modal('show');
        }
    }
    
    static saveEditedItem() {
        const id = $('#edit-item-id').val();
        const name = $('#edit-item-name').val();
        const quantity = parseInt($('#edit-item-quantity').val());
        
        if (!quantity || quantity < 0) {
            Utils.showNotification('La cantidad debe ser un número positivo', 'warning');
            return;
        }
        
        const itemIndex = this.scanned.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
            this.scanned[itemIndex].name = name;
            this.scanned[itemIndex].scannedQuantity = quantity;
            
            // Actualizar inventario teórico si corresponde
            const theoreticalIndex = this.theoretical.findIndex(item => item.code === this.scanned[itemIndex].code);
            if (theoreticalIndex !== -1) {
                this.theoretical[theoreticalIndex].scannedQuantity = quantity;
            }
            
            this.saveToStorage();
            this.updateScannedTable();
            
            $('#editItemModal').modal('hide');
            Utils.showNotification('Producto actualizado correctamente', 'success');
        }
    }
    
    static deleteItem(id) {
        if (confirm('¿Está seguro de que desea eliminar este producto?')) {
            const itemIndex = this.scanned.findIndex(item => item.id === id);
            if (itemIndex !== -1) {
                const code = this.scanned[itemIndex].code;
                
                // Resetear cantidad en inventario teórico
                const theoreticalIndex = this.theoretical.findIndex(item => item.code === code);
                if (theoreticalIndex !== -1) {
                    this.theoretical[theoreticalIndex].scannedQuantity = 0;
                }
                
                this.scanned.splice(itemIndex, 1);
                this.saveToStorage();
                this.updateScannedTable();
                
                Utils.showNotification('Producto eliminado correctamente', 'success');
            }
        }
    }
    
    // Getters
    static getTheoretical() { 
        return this.theoretical; 
    }
    
    static getScanned() { 
        return this.scanned; 
    }
    
    static getConfig() { 
        return this.config; 
    }
    
    // Calcular estadísticas
    static calculateStats() {
        const totalTheoretical = this.theoretical.reduce((sum, item) => sum + item.theoreticalQuantity, 0);
        const totalScanned = this.scanned.reduce((sum, item) => sum + item.scannedQuantity, 0);
        
        let discrepancies = 0;
        this.theoretical.forEach(item => {
            const scannedItem = this.scanned.find(s => s.code === item.code);
            const scannedQty = scannedItem ? scannedItem.scannedQuantity : 0;
            
            if (scannedQty !== item.theoreticalQuantity) {
                discrepancies++;
            }
        });
        
        // Agregar items escaneados que no están en teórico
        this.scanned.forEach(item => {
            if (!this.theoretical.find(t => t.code === item.code)) {
                discrepancies++;
            }
        });
        
        const completionRate = this.theoretical.length > 0 ? 
            Math.round((this.scanned.filter(s => this.theoretical.find(t => t.code === s.code)).length / this.theoretical.length) * 100) : 0;
        
        return {
            totalTheoretical,
            totalScanned,
            discrepancies,
            completionRate
        };
    }
}