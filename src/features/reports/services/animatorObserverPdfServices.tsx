import { renderToString } from "react-dom/server";
import { UserData } from "../../../features/users/services/userService";
import { Teacher } from "../../../features/teachers/types";
import { AnimatorWithUser } from "../../../features/animators/services/animatorService";
import { AnimatorPdfTemplate } from "../../../pages/reports/templates/AnimatorPdfTemplate";
import { ObserverDirPdfTemplate, ObserverAssignPdfTemplate } from "../../../pages/reports/templates/ObserverPdfTemplates";
// @ts-ignore
import html2pdf from "html2pdf.js";

const generatePdfFromHtml = async (htmlString: string, filename: string) => {
    const fullHtmlBody = `<div id="pdf-root">${htmlString}</div>`;
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';

    const tempContainer = document.createElement('div');
    tempContainer.style.width = '800px';
    tempContainer.style.background = 'white';

    const fontCss = `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;700&display=swap');`;
    tempContainer.innerHTML = `<style>${fontCss}</style>${fullHtmlBody}`;

    wrapper.appendChild(tempContainer);
    document.body.appendChild(wrapper);

    try {
        if ((document as any).fonts && (document as any).fonts.ready) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            await document.fonts.ready;
        }

        const opt = {
            margin: 10,
            filename,
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

        await html2pdf().from(tempContainer).set(opt).save();
    } catch (error) {
        console.error('PDF generation failed:', error);
        throw error;
    } finally {
        try { document.body.removeChild(wrapper); } catch (e) { /* ignore */ }
    }
};

export const PremiumAnimatorObserverPdfService = {
    generateAnimatorReport: async (
        animators: AnimatorWithUser[],
        parishes: any[],
        foraneFilter: string,
        parishFilter: string,
        yearFilter: string = "All Years"
    ) => {
        const html = renderToString(
            <AnimatorPdfTemplate
                animators={animators}
                parishes={parishes}
                foraneFilter={foraneFilter}
                parishFilter={parishFilter}
                yearFilter={yearFilter}
            />
        );
        await generatePdfFromHtml(html, `Animator_Registry_${new Date().toISOString().split('T')[0]}.pdf`);
    },

    generateObserverDirectoryReport: async (
        observers: Teacher[],
        users: UserData[],
        foraneFilter: string,
        parishFilter: string,
        academicYear: string
    ) => {
        const html = renderToString(
            <ObserverDirPdfTemplate
                observers={observers}
                users={users}
                foraneFilter={foraneFilter}
                parishFilter={parishFilter}
                academicYear={academicYear}
            />
        );
        await generatePdfFromHtml(html, `Observer_Directory_${new Date().toISOString().split('T')[0]}.pdf`);
    },

    generateObserverAssignmentReport: async (
        assignments: any[],
        teachers: Teacher[],
        users: UserData[],
        foraneFilter: string,
        parishFilter: string,
        academicYear: string
    ) => {
        const html = renderToString(
            <ObserverAssignPdfTemplate
                assignments={assignments}
                teachers={teachers}
                users={users}
                foraneFilter={foraneFilter}
                parishFilter={parishFilter}
                academicYear={academicYear}
            />
        );
        await generatePdfFromHtml(html, `Observer_Assignments_${new Date().toISOString().split('T')[0]}.pdf`);
    }
};
