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

            // 7. Calculate precise dimensions for A4 and find element positions to prevent page splits
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const margin = 10;
            const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

            const effectiveWidth = pdfWidth - (margin * 2); // 190mm
            const effectiveHeight = pdfHeight - (margin * 2); // 277mm

            // Max canvas height in pixels per PDF page
            const maxPageCanvasHeight = (effectiveHeight / effectiveWidth) * canvas.width;

            // Collect bounds of all elements that shouldn't be split mid-row/mid-card
            const keepTogetherElements = Array.from(tempContainer.querySelectorAll('.pdf-keep-together, tr, h1, h2, h3, table, .pdf-header'));
            const containerRect = tempContainer.getBoundingClientRect();
            const scaleFactor = canvas.width / tempContainer.offsetWidth;

            const protectedBounds: { topPx: number; bottomPx: number }[] = [];
            keepTogetherElements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                const topPx = (rect.top - containerRect.top) * scaleFactor;
                const bottomPx = (rect.bottom - containerRect.top) * scaleFactor;
                if (bottomPx > topPx) {
                    protectedBounds.push({ topPx, bottomPx });
                }
            });

            protectedBounds.sort((a, b) => a.topPx - b.topPx);

            let currentY = 0;
            const totalCanvasHeight = canvas.height;
            let pageIndex = 0;

            while (currentY < totalCanvasHeight) {
                let targetY = currentY + maxPageCanvasHeight;

                if (targetY < totalCanvasHeight) {
                    // Check if targetY cuts through any protected element
                    for (const bound of protectedBounds) {
                        if (bound.topPx < targetY && bound.bottomPx > targetY) {
                            // Adjust slice point to top of element if element starts sufficiently after currentY
                            if (bound.topPx > currentY + 30) {
                                targetY = bound.topPx;
                                break;
                            }
                        }
                    }
                } else {
                    targetY = totalCanvasHeight;
                }

                const sliceHeight = targetY - currentY;

                // Create individual page sub-canvas
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = sliceHeight;
                const ctx = sliceCanvas.getContext('2d');

                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                    ctx.drawImage(
                        canvas,
                        0, currentY, canvas.width, sliceHeight,
                        0, 0, canvas.width, sliceHeight
                    );
                }

                const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 1.0);
                const sliceImgHeightMm = (sliceHeight * effectiveWidth) / canvas.width;

                if (pageIndex > 0) {
                    pdf.addPage();
                }
                pdf.addImage(sliceImgData, 'JPEG', margin, margin, effectiveWidth, sliceImgHeightMm);

                currentY = targetY;
                pageIndex++;
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
