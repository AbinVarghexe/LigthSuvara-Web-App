import { renderToString } from "react-dom/server";
import { ProgramRegistration, CustomField, ProgramData } from "../../../features/programs/services/programService";
import { ProgramPdfTemplate } from "../../../pages/reports/templates/ProgramPdfTemplate";
import { UserData } from "../../../features/users/services/userService";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const PremiumProgramPdfService = {
    /**
     * Generates a premium PDF report for Program Registrations using html2canvas & jsPDF.
     */
    generateReport: async (
        registrations: ProgramRegistration[],
        programName: string,
        forane: string,
        parish: string,
        users: UserData[],
        role?: 'student' | 'teacher',
        customFields?: CustomField[],
        paymentDetails?: ProgramData['paymentDetails']
    ) => {
        // 1. Render React component to static HTML string
        const htmlString = renderToString(
            <ProgramPdfTemplate
                registrations={registrations}
                programName={programName}
                forane={forane}
                parish={parish}
                users={users}
                role={role}
                customFields={customFields}
                paymentDetails={paymentDetails}
            />
        );

        // 2. Wrap in a full HTML document body
        const fullHtmlBody = `
      <div id="pg-pdf-root">
        ${htmlString}
      </div>
    `;

        // 3. Create an invisible wrapper for DOM attachment
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.left = '-9999px';
        wrapper.style.top = '0';

        // 4. Create the actual container to be captured
        const tempContainer = document.createElement('div');
        tempContainer.style.width = '600px'; // Exact width of our template
        tempContainer.style.background = 'white';

        // 5. Inject fonts and content
        const fontCss = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Malayalam:wght@400;700&display=swap');`;
        tempContainer.innerHTML = `<style>${fontCss}</style>${fullHtmlBody}`;

        wrapper.appendChild(tempContainer);
        document.body.appendChild(wrapper);

        try {
            // Wait for fonts to be ready
            if ((document as any).fonts && (document as any).fonts.ready) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                await document.fonts.ready;
            }

            // 6. Generate canvas with html2canvas
            const canvas = await html2canvas(tempContainer, {
                scale: 3, // High resolution rendering
                useCORS: true,
                logging: false,
            });

            // 7. Calculate precise dimensions for A4
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const margin = 10;
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const effectiveWidth = pdfWidth - (margin * 2);
            const imgHeight = (canvas.height * effectiveWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = margin; // Starting position (Y offset)

            // First page
            pdf.addImage(imgData, 'JPEG', margin, position, effectiveWidth, imgHeight);
            heightLeft -= (pdfHeight - (margin * 2));

            // Setup pagination if height is still left
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight; // Shift position up by the height of what's already printed
                pdf.addPage();
                // Add the same image but shifted up
                pdf.addImage(imgData, 'JPEG', margin, position + margin, effectiveWidth, imgHeight);
                heightLeft -= (pdfHeight - (margin * 2)); // Subtract effective page height
            }

            pdf.save(`${programName.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error('Premium Program report generation failed:', error);
            throw error;
        } finally {
            // Cleanup
            try { document.body.removeChild(wrapper); } catch (e) { /* ignore */ }
        }
    },
};
