import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ObserverDutyOrderPdfTemplate, ObserverAdminPdfTemplate } from '../../../pages/reports/templates/ObserverIndividualPdfTemplates';
import logoUrl from '../../../assets/reportlogo.jpg';

// Helper to convert image URL to Base64
async function fetchImageAsBase64(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Failed to load logo", e);
        return "";
    }
}

export const IndividualObserverPdfService = {
    generateDutyOrderPdf: async (assignment: any, eventDate: string | null) => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.left = '-9999px';
        wrapper.style.top = '-9999px';
        document.body.appendChild(wrapper);

        try {
            const logoBase64 = await fetchImageAsBase64(logoUrl);

            const root = createRoot(wrapper);
            await new Promise<void>((resolve) => {
                root.render(
                    <div id="observer-duty-order-pdf-container">
                        <ObserverDutyOrderPdfTemplate
                            assignment={assignment}
                            logoBase64={logoBase64}
                            eventDate={eventDate}
                        />
                    </div>
                );
                // Wait for render
                setTimeout(resolve, 500);
            });

            const element = document.getElementById('observer-duty-order-pdf-container');
            if (!element) throw new Error('PDF container not found');

            const canvas = await html2canvas(element, {
                scale: 4,
                useCORS: true,
                logging: false,
                windowWidth: 600,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const margin = 10;
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const effectiveWidth = pdfWidth - (margin * 2);
            const imgHeight = (canvas.height * effectiveWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', margin, margin, effectiveWidth, imgHeight);
            pdf.save(`Observer_Duty_Order_${assignment.teacherName.replace(/\\s+/g, '_')}.pdf`);

        } catch (error) {
            console.error('Duty Order PDF failure:', error);
            throw error;
        } finally {
            try { document.body.removeChild(wrapper); } catch (e) { /* ignore */ }
        }
    },

    generateAdminReportPdf: async (assignment: any, eventDate: string | null) => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.left = '-9999px';
        wrapper.style.top = '-9999px';
        document.body.appendChild(wrapper);

        try {
            const logoBase64 = await fetchImageAsBase64(logoUrl);

            const root = createRoot(wrapper);
            await new Promise<void>((resolve) => {
                root.render(
                    <div id="observer-admin-pdf-container">
                        <ObserverAdminPdfTemplate
                            assignment={assignment}
                            logoBase64={logoBase64}
                            eventDate={eventDate}
                        />
                    </div>
                );
                setTimeout(resolve, 500);
            });

            const element = document.getElementById('observer-admin-pdf-container');
            if (!element) throw new Error('PDF container not found');

            const canvas = await html2canvas(element, {
                scale: 4,
                useCORS: true,
                logging: false,
                windowWidth: 600,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const margin = 10;
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const effectiveWidth = pdfWidth - (margin * 2);
            const imgHeight = (canvas.height * effectiveWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', margin, margin, effectiveWidth, imgHeight);
            pdf.save(`Observer_Admin_Record_${assignment.teacherName.replace(/\\s+/g, '_')}.pdf`);

        } catch (error) {
            console.error('Admin Record PDF failure:', error);
            throw error;
        } finally {
            try { document.body.removeChild(wrapper); } catch (e) { /* ignore */ }
        }
    }
};
