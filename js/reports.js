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
            
            // OBSERVACIONES - NUEVA SECCIÓN
            let currentY = 60;
            if (config.observations && config.observations.trim() !== '') {
                doc.setFontSize(12);
                doc.text('OBSERVACIONES:', 20, currentY);
                currentY += 7;
                
                doc.setFontSize(10);
                const splitObservations = doc.splitTextToSize(config.observations, 170);
                doc.text(splitObservations, 20, currentY);
                currentY += (splitObservations.length * 5) + 10;
            } else {
                currentY += 5;
            }
            
            // Resumen
            const summary = this.calculateSummary();
            doc.setFontSize(14);
            doc.text('RESUMEN DEL INVENTARIO', 20, currentY);
            currentY += 10;
            
            doc.setFontSize(10);
            doc.text(`• Total de items en inventario: ${summary.totalItems}`, 25, currentY);
            currentY += 7;
            doc.text(`• Items correctos: ${summary.correctItems}`, 25, currentY);
            currentY += 7;
            doc.text(`• Items con discrepancia: ${summary.discrepancyItems}`, 25, currentY);
            currentY += 7;
            doc.text(`• Items no escaneados: ${summary.missingItems}`, 25, currentY);
            currentY += 7;
            doc.text(`• Tasa de precisión: ${summary.accuracyRate}%`, 25, currentY);
            currentY += 10;
            
            // Tabla de productos
            doc.setFontSize(12);
            doc.text('DETALLE DE PRODUCTOS', 20, currentY);
            currentY += 10;
            
            doc.autoTable({
                startY: currentY,
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
                margin: { top: currentY }
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
    
    // ... (el resto de los métodos permanecen iguales)
}