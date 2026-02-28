import { renderToString } from "react-dom/server";
import { Teacher, Parish } from "../../../features/teachers/types";
import { TeacherClassPdfTemplate } from "../../../pages/reports/templates/TeacherClassPdfTemplate";
// @ts-ignore
import html2pdf from "html2pdf.js";

export const PremiumTeacherClassPdfService = {
    /**
     * Generates a premium PDF report for Teachers grouped by Forane and Parish using html2pdf.js.
     */
    generateReport: async (
        teachers: Teacher[],
        parishes: Parish[],
        academicYear: string,
        classFilter: string,
        foraneFilter: string,
        parishFilter: string
    ) => {
        // 1. Render React component to static HTML string
        const htmlString = renderToString(
            <TeacherClassPdfTemplate
                teachers={teachers}
                parishes={parishes}
                academicYear={academicYear}
                classFilter={classFilter}
                foraneFilter={foraneFilter}
                parishFilter={parishFilter}
            />
        );

        // 2. Wrap in a full HTML document body
        const fullHtmlBody = `
      <div id="teacher-pdf-root">
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
        tempContainer.style.width = '800px';
        tempContainer.style.background = 'white';

        // 5. Inject fonts and content
        const fontCss = `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;700&display=swap');`;
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

            // 6. Configure html2pdf options (identical to Event/Marks reliable config)
            const opt = {
                margin: 10,
                filename: `Teacher_Registry_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg' as const, quality: 1.0 },
                html2canvas: {
                    scale: 3,
                    useCORS: true,
                    letterRendering: true,
                    scrollY: 0,
                    windowWidth: 1200,
                    logging: false,
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            // 7. Generate and save PDF, capturing only the inner container
            await html2pdf().from(tempContainer).set(opt).save();
        } catch (error) {
            console.error('Premium Teacher Class report generation failed:', error);
            throw error;
        } finally {
            // Cleanup
            try { document.body.removeChild(wrapper); } catch (e) { /* ignore */ }
        }
    },
};
