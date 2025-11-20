// Módulo de interfaz de usuario
class UI {
    static currentSection = 'dashboard';
    
    static init() {
        this.setupNavigation();
        this.loadTemplates();
        this.setupModals();
    }
    
    static setupNavigation() {
        $(document).on('click', '#sidebar-nav .nav-link', function(e) {
            e.preventDefault();
            const section = $(this).data('section');
            UI.loadSection(section);
        });
    }
    
    static async loadSection(section) {
        this.currentSection = section;
        
        // Actualizar navegación activa
        $('#sidebar-nav .nav-link').removeClass('active');
        $(`#sidebar-nav .nav-link[data-section="${section}"]`).addClass('active');
        
        // Cargar contenido de la sección
        try {
            const response = await fetch(`templates/${section}.html`);
            const content = await response.text();
            $('#main-content').html(content);
            
            // Inicializar componentes específicos de la sección
            this.initializeSectionComponents(section);
            
        } catch (error) {
            console.error('Error loading section:', error);
            $('#main-content').html(`
                <div class="alert alert-danger">
                    <h4>Error al cargar la sección</h4>
                    <p>No se pudo cargar el contenido de ${section}. Por favor, recargue la página.</p>
                </div>
            `);
        }
    }
    
    static initializeSectionComponents(section) {
        switch(section) {
            case 'dashboard':
                App.refreshDashboard();
                break;
            case 'inventory-setup':
                Inventory.updateExcelPreview();
                break;
            case 'scanned-items':
                Inventory.updateScannedTable();
                break;
            case 'reports':
                Reports.updateReportTable();
                break;
            case 'history':
                History.updateHistoryTable();
                break;
        }
    }
    
    static loadTemplates() {
        // Precargar templates si es necesario
        // Por ahora, los templates se cargan bajo demanda
    }
    
    static setupModals() {
        // Cargar modales comunes
        const modalsHTML = `
            <!-- Edit Item Modal -->
            <div class="modal fade" id="editItemModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar Producto Escaneado</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-item-form">
                                <input type="hidden" id="edit-item-id">
                                <div class="mb-3">
                                    <label for="edit-item-code" class="form-label">Código</label>
                                    <input type="text" class="form-control" id="edit-item-code" readonly>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-item-name" class="form-label">Producto</label>
                                    <input type="text" class="form-control" id="edit-item-name">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-item-quantity" class="form-label">Cantidad Escaneada</label>
                                    <input type="number" class="form-control" id="edit-item-quantity" min="1" required>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="save-edit-btn">Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Finalize Inventory Modal -->
            <div class="modal fade" id="finalizeInventoryModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Finalizar Inventario</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>¿Está seguro de que desea finalizar el inventario actual?</p>
                            <p><strong>Esta acción guardará el inventario en el historial y limpiará todos los datos actuales.</strong></p>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="generate-final-report">
                                <label class="form-check-label" for="generate-final-report">
                                    Generar informe PDF final antes de limpiar
                                </label>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn finalize-btn text-white" id="confirm-finalize-btn">Finalizar Inventario</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('#modals-container').html(modalsHTML);
    }
    
    static showLoading(selector) {
        $(selector).html('<div class="text-center"><div class="loading-spinner"></div> Cargando...</div>');
    }
    
    static hideLoading(selector, content) {
        $(selector).html(content);
    }
    
    static updateProgressBar(percentage) {
        const progressBar = $('#progress-bar');
        progressBar.css('width', `${percentage}%`);
        progressBar.text(`${Math.round(percentage)}%`);
        
        // Cambiar color según el progreso
        if (percentage >= 90) {
            progressBar.removeClass('bg-warning').addClass('bg-success');
        } else if (percentage >= 50) {
            progressBar.removeClass('bg-danger bg-success').addClass('bg-warning');
        } else {
            progressBar.removeClass('bg-warning bg-success').addClass('bg-danger');
        }
    }
}