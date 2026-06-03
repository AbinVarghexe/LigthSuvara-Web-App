import { createRoot } from "react-dom/client";
import { PublicRegistrationPdfTemplate } from "../../../pages/reports/templates/PublicRegistrationPdfTemplate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import logoUrl from "../../../assets/Logo.png";

// Helper to convert image URL to Base64
async function fetchImageAsBase64(url: string): Promise<string> {
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        return await blobToBase64(blob);
    } catch (error) {
        console.warn("Direct CORS fetch failed. Attempting weserv proxy...", url);
        try {
            const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
            const proxyResponse = await fetch(proxyUrl);
            if (!proxyResponse.ok) throw new Error(`Proxy fallback failed: ${proxyResponse.statusText}`);
            const proxyBlob = await proxyResponse.blob();
            return await blobToBase64(proxyBlob);
        } catch (proxyError) {
            console.error("Failed to fetch image for PDF via weserv proxy:", url, proxyError);
            try {
                const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl2);
                const proxyBlob2 = await proxyRes.blob();
                return await blobToBase64(proxyBlob2);
            } catch (e) {
                console.error("All image fetch attempts failed.");
                return "";
            }
        }
    }
}

export const PremiumPublicRegistrationPdfService = {
    generateReport: async (
        registrations: any[],
        programName: string,
        fields: any[],
        selectedProgramId: string
    ) => {
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
                    <div id="public-reg-pdf-wrapper">
                        <PublicRegistrationPdfTemplate
                            registrations={registrations}
                            programName={programName}
                            fields={fields}
                            logoBase64={logoBase64}
                            selectedProgramId={selectedProgramId}
                        />
                    </div>
                );
                setTimeout(resolve, 500);
            });

            const element = document.getElementById('public-reg-pdf-wrapper');
            if (!element) throw new Error('PDF container not found');

            const canvas = await html2canvas(element, {
                scale: 3,
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
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const effectiveWidth = pdfWidth - (margin * 2);
            const imgHeight = (canvas.height * effectiveWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = margin;

            // First page
            pdf.addImage(imgData, 'JPEG', margin, position, effectiveWidth, imgHeight);
            heightLeft -= (pdfHeight - (margin * 2));

            // Pagination
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', margin, position + margin, effectiveWidth, imgHeight);
                heightLeft -= (pdfHeight - (margin * 2));
            }

            const fileNameSuffix = selectedProgramId !== "all" 
                ? programName.replace(/\s+/g, "_") 
                : "all";
            pdf.save(`Registrations_${fileNameSuffix}_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error('Premium Public Registration report generation failed:', error);
            throw error;
        } finally {
            try { document.body.removeChild(wrapper); } catch (e) { /* ignore */ }
        }
    }
};
