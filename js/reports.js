// Módulo de reportes
class Reports {
    static init() {
        this.setupEventListeners();
    }
    
    static setupEventListeners() {
        $(document).on('click', '#generate-pdf-btn', () => this.generatePDF());
        $(document).on('click', '#export-csv-btn', () => this.exportCSV());
    }
    
    static generatePDF() {
        if (!window.jspdf) {
            Utils.showNotification('Error: Biblioteca PDF no cargada', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const config = Inventory.getConfig();
        const theoretical = Inventory.getTheoretical();
        const scanned = Inventory.getScanned();
        
        if (theoretical.length === 0) {
            Utils.showNotification('No hay datos de inventario para generar reporte', 'warning');
            return;
        }
        
        try {
            // Título
            doc.setFontSize(18);
            doc.text('INFORME DE INVENTARIO - TIENDAS K24', 105, 15, { align: 'center' });
            
            // Detalles del inventario
            doc.setFontSize(12);
            doc.text(`Fecha del inventario: ${config.date || 'No especificada'}`, 20, 25);
            doc.text(`Tienda: ${config.store || 'No especificada'}`, 20, 32);
            doc.text(`Responsable: ${config.responsible || 'No especificado'}`, 20, 39);
            doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 46);
            doc.text(`Generado por: ${Auth.getUser()?.name || 'Usuario'}`, 20, 53);
            
            // Resumen
            const summary = this.calculateSummary();
            doc.setFontSize(14);
            doc.text('RESUMEN DEL INVENTARIO', 20, 65);
            
            doc.setFontSize(10);
            doc.text(`• Total de items en inventario: ${summary.totalItems}`, 25, 75);
            doc.text(`• Items correctos: ${summary.correctItems}`, 25, 82);
            doc.text(`• Items con discrepancia: ${summary.discrepancyItems}`, 25, 89);
            doc.text(`• Items no escaneados: ${summary.missingItems}`, 25, 96);
            doc.text(`• Tasa de precisión: ${summary.accuracyRate}%`, 25, 103);
            
            // Tabla de productos
            let startY = 115;
            doc.setFontSize(12);
            doc.text('DETALLE DE PRODUCTOS', 20, startY);
            startY += 10;
            
            doc.autoTable({
                startY: startY,
                head: [['Código', 'Producto', 'Cant. Teórica', 'Cant. Real', 'Diferencia', 'Estado']],
                body: this.getReportData(),
                styles: { 
                    fontSize: 8,
                    cellPadding: 2
                },
                headStyles: { 
                    fillColor: [44, 62, 80],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: { 
                    fillColor: [248, 249, 250] 
                },
                didDrawCell: (data) => {
                    // Resaltar discrepancias
                    if (data.section === 'body' && data.column.index === 5) {
                        const status = data.cell.raw;
                        if (status === 'Exceso' || status === 'Faltante') {
                            doc.setFillColor(255, 243, 205); // Amarillo claro
                            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                        } else if (status === 'No en inventario') {
                            doc.setFillColor(255, 230, 230); // Rojo muy claro
                            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                        } else if (status === 'No escaneado') {
                            doc.setFillColor(240, 240, 240); // Gris claro
                            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                        }
                    }
                },
                margin: { top: startY }
            });
            
            // Pie de página
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`Página ${i} de ${pageCount} - Sistema de Inventario Tiendas K24`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
            }
            
            // Guardar el PDF
            const filename = `Inventario_K24_${config.store || 'Tienda'}_${config.date || new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
            
            Utils.showNotification('PDF generado correctamente', 'success');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            Utils.showNotification('Error al generar el PDF', 'error');
        }
    }
    
    static calculateSummary() {
        const theoretical = Inventory.getTheoretical();
        const scanned = Inventory.getScanned();
        
        let totalItems = theoretical.length;
        let correctItems = 0;
        let discrepancyItems = 0;
        let missingItems = 0;
        
        theoretical.forEach(item => {
            const scannedItem = scanned.find(s => s.code === item.code);
            const scannedQty = scannedItem ? scannedItem.scannedQuantity : 0;
            
            if (scannedQty === 0) {
                missingItems++;
            } else if (scannedQty === item.theoreticalQuantity) {
                correctItems++;
            } else {
                discrepancyItems++;
            }
        });
        
        // Items escaneados que no están en el teórico
        scanned.forEach(item => {
            if (!theoretical.find(t => t.code === item.code)) {
                totalItems++;
                discrepancyItems++;
            }
        });
        
        const accuracyRate = totalItems > 0 ? Math.round((correctItems / totalItems) * 100) : 0;
        
        return {
            totalItems,
            correctItems,
            discrepancyItems,
            missingItems,
            accuracyRate
        };
    }
    
    static getReportData() {
        const data = [];
        const theoretical = Inventory.getTheoretical();
        const scanned = Inventory.getScanned();
        
        // Procesar inventario teórico
        theoretical.forEach(item => {
            const scannedItem = scanned.find(s => s.code === item.code);
            const scannedQty = scannedItem ? scannedItem.scannedQuantity : 0;
            const difference = scannedQty - item.theoreticalQuantity;
            
            let status;
            if (scannedQty === 0) {
                status = 'No escaneado';
            } else if (difference === 0) {
                status = 'Correcto';
            } else {
                status = difference > 0 ? 'Exceso' : 'Faltante';
            }
            
            data.push([
                item.code,
                item.name,
                item.theoreticalQuantity.toString(),
                scannedQty.toString(),
                difference.toString(),
                status
            ]);
        });
        
        // Items escaneados que no están en teórico
        scanned.forEach(item => {
            if (!theoretical.find(t => t.code === item.code)) {
                data.push([
                    item.code,
                    item.name,
                    '0',
                    item.scannedQuantity.toString(),
                    item.scannedQuantity.toString(),
                    'No en inventario'
                ]);
            }
        });
        
        return data;
    }
    
    static exportCSV() {
        const data = this.getReportDataForCSV();
        if (data.length === 0) {
            Utils.showNotification('No hay datos para exportar', 'warning');
            return;
        }
        
        const config = Inventory.getConfig();
        const filename = `Inventario_K24_${config.store || 'Tienda'}_${config.date || new Date().toISOString().split('T')[0]}.csv`;
        
        Utils.exportToCSV(data, filename);
        Utils.showNotification('CSV exportado correctamente', 'success');
    }
    
    static getReportDataForCSV() {
        const data = [];
        const theoretical = Inventory.getTheoretical();
        const scanned = Inventory.getScanned();
        
        // Encabezados
        data.push({
            'Código': 'Código',
            'Producto': 'Producto',
            'Cantidad_Teorica': 'Cantidad Teórica',
            'Cantidad_Real': 'Cantidad Real',
            'Diferencia': 'Diferencia',
            'Estado': 'Estado',
            'Tienda': Inventory.getConfig().store || 'No especificada',
            'Fecha_Inventario': Inventory.getConfig().date || 'No especificada'
        });
        
        // Datos
        theoretical.forEach(item => {
            const scannedItem = scanned.find(s => s.code === item.code);
            const scannedQty = scannedItem ? scannedItem.scannedQuantity : 0;
            const difference = scannedQty - item.theoreticalQuantity;
            
            let status;
            if (scannedQty === 0) {
                status = 'No escaneado';
            } else if (difference === 0) {
                status = 'Correcto';
            } else {
                status = difference > 0 ? 'Exceso' : 'Faltante';
            }
            
            data.push({
                'Código': item.code,
                'Producto': item.name,
                'Cantidad_Teorica': item.theoreticalQuantity,
                'Cantidad_Real': scannedQty,
                'Diferencia': difference,
                'Estado': status,
                'Tienda': Inventory.getConfig().store || 'No especificada',
                'Fecha_Inventario': Inventory.getConfig().date || 'No especificada'
            });
        });
        
        return data;
    }
    
    static updateReportTable() {
        const summary = this.calculateSummary();
        
        $('#total-items-count').text(summary.totalItems);
        $('#correct-items-count').text(summary.correctItems);
        $('#discrepancy-items-count').text(summary.discrepancyItems);
        $('#missing-items-count').text(summary.missingItems);
        $('#accuracy-rate').text(`${summary.accuracyRate}%`);
        
        // Actualizar tabla de reportes
        this.updateReportDataTable();
    }
    
    static updateReportDataTable() {
        const tableBody = $('#report-table tbody');
        tableBody.empty();
        
        const data = this.getReportData();
        
        if (data.length === 0) {
            tableBody.append(`
                <tr>
                    <td colspan="6" class="text-center text-muted">No hay datos para mostrar</td>
                </tr>
            `);
            return;
        }
        
        data.forEach(row => {
            const statusClass = row[5] === 'Correcto' ? 'success' : 
                              row[5] === 'Exceso' || row[5] === 'Faltante' ? 'warning' :
                              row[5] === 'No en inventario' ? 'info' : 'secondary';
            
            tableBody.append(`
                <tr>
                    <td>${row[0]}</td>
                    <td>${row[1]}</td>
                    <td>${row[2]}</td>
                    <td>${row[3]}</td>
                    <td>${row[4]}</td>
                    <td><span class="badge bg-${statusClass}">${row[5]}</span></td>
                </tr>
            `);
        });
        
        // Inicializar DataTable si existe
        if ($.fn.DataTable.isDataTable('#report-table')) {
            $('#report-table').DataTable().destroy();
        }
        
        $('#report-table').DataTable({
            pageLength: 10,
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json'
            },
            order: [[0, 'asc']]
        });
    }
}