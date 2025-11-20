// Módulo de escaneo
class Scanner {
    static isScanning = false;
    
    static init() {
        this.setupEventListeners();
        this.updateRecentScans();
    }
    
    static setupEventListeners() {
        $(document).on('click', '#toggle-scan', () => this.toggleScan());
        $(document).on('keypress', '#barcode-input', (e) => this.handleBarcodeInput(e));
        $(document).on('click', '#manual-add-btn', () => this.handleManualAdd());
    }
    
    static toggleScan() {
        this.isScanning = !this.isScanning;
        
        if (this.isScanning) {
            this.startScanning();
        } else {
            this.stopScanning();
        }
    }
    
    static startScanning() {
        $('#toggle-scan')
            .text('Detener Escaneo')
            .removeClass('btn-outline-secondary')
            .addClass('btn-danger');
        
        $('#scanner-area').addClass('scanning-active');
        $('#scan-status').removeClass('d-none');
        $('#barcode-input').prop('disabled', false).focus();
        
        Utils.showNotification('Modo escaneo activado', 'success');
    }
    
    static stopScanning() {
        $('#toggle-scan')
            .text('Iniciar Escaneo')
            .removeClass('btn-danger')
            .addClass('btn-outline-secondary');
        
        $('#scanner-area').removeClass('scanning-active');
        $('#scan-status').addClass('d-none');
        $('#barcode-input').prop('disabled', true).val('');
        
        Utils.showNotification('Modo escaneo desactivado', 'info');
    }
    
    static handleBarcodeInput(e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            this.processBarcode($('#barcode-input').val());
            $('#barcode-input').val('').focus();
        }
    }
    
    static handleManualAdd() {
        const barcode = $('#barcode-input').val();
        if (barcode) {
            this.processBarcode(barcode);
            $('#barcode-input').val('').focus();
        } else {
            Utils.showNotification('Ingrese un código de barras', 'warning');
        }
    }
    
    static processBarcode(barcode) {
        if (!barcode.trim()) return;
        
        const wasFound = Inventory.addScannedItem(barcode);
        
        if (wasFound) {
            const item = Inventory.getTheoretical().find(i => i.code === barcode);
            Utils.showNotification(`Producto escaneado: ${item.name}`, 'success');
        } else {
            Utils.showNotification('Producto no encontrado en inventario teórico', 'warning');
        }
        
        this.updateRecentScans();
        App.refreshDashboard();
        
        // Emitir sonido de escaneo (opcional)
        this.playScanSound();
    }
    
    static updateRecentScans() {
        const recentScans = $('#recent-scans');
        recentScans.empty();
        
        const scanned = Inventory.getScanned();
        const recentItems = scanned.slice(-5).reverse();
        
        if (recentItems.length === 0) {
            recentScans.append('<p class="text-muted text-center">No hay escaneos recientes</p>');
            return;
        }
        
        recentItems.forEach(item => {
            const status = item.scannedQuantity === item.theoreticalQuantity ? 'success' : 
                          item.scannedQuantity > item.theoreticalQuantity ? 'warning' : 'danger';
            
            recentScans.append(`
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${item.name}</h6>
                            <p class="mb-1 small text-muted">Código: ${item.code}</p>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-${status}">${item.scannedQuantity}x</span>
                            <div class="mt-1">
                                <small class="text-muted">Teórico: ${item.theoreticalQuantity}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        });
    }
    
    static playScanSound() {
        // Crear un sonido de escaneo simple
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
            
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.1);
        } catch (error) {
            console.log('Audio no soportado');
        }
    }
    
    static getScanningStatus() {
        return this.isScanning;
    }
}