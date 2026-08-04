import { renderToString } from "react-dom/server";
import { ProgramRegistration, CustomField, ProgramData } from "../../../features/programs/services/programService";
import { ProgramPdfTemplate } from "../../../pages/reports/templates/ProgramPdfTemplate";
import { UserData } from "../../../features/users/services/userService";
import { ref as storageRef, getBlob, getBytes } from "firebase/storage";
import { storage } from "../../../config/firebase";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Helper to extract storage path from any Firebase Storage URL
function extractStoragePath(url: string): string | null {
    try {
        if (!url || typeof url !== 'string') return null;
        if (url.includes('/o/')) {
            const afterO = url.split('/o/')[1];
            if (afterO) {
                const rawPath = afterO.split('?')[0];
                return decodeURIComponent(rawPath);
            }
        }
    } catch (e) {
        console.warn("Storage path extraction error:", e);
    }
    return null;
}

// Convert Blob to Base64 Data URI string via FileReader
async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            let res = (reader.result as string) || "";
            if (res.startsWith("data:application/octet-stream")) {
                res = res.replace("data:application/octet-stream", "data:image/jpeg");
            }
            if (!res.startsWith("data:image/")) {
                const commaIdx = res.indexOf(",");
                if (commaIdx !== -1) {
                    res = "data:image/jpeg;base64" + res.substring(commaIdx);
                } else {
                    res = "data:image/jpeg;base64," + res;
                }
            }
            resolve(res);
        };
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
    });
}

// Helper to fetch image blob across 5 fail-safe strategies
async function fetchImageBlob(url: string): Promise<Blob | null> {
    if (!url) return null;

    // Strategy 0: Local Vite Server Proxy (100% CORS-free for Firebase Storage links)
    if (url.includes('firebasestorage.googleapis.com')) {
        try {
            const urlObj = new URL(url);
            const proxyPath = `/firebase-img-proxy${urlObj.pathname}${urlObj.search}`;
            const response = await fetch(proxyPath);
            if (response.ok) {
                const blob = await response.blob();
                if (blob && blob.size > 0) return blob;
            }
        } catch (err) {
            console.warn("Vite server proxy fetch failed:", err);
        }
    }

    // Strategy 1: Firebase Storage SDK via Path Ref (Native SDK authenticated download)
    const storagePath = extractStoragePath(url);
    if (storagePath) {
        try {
            const pathRef = storageRef(storage, storagePath);
            const blob = await getBlob(pathRef);
            if (blob && blob.size > 0) return blob;
        } catch (e1) {
            console.warn("Firebase PathRef getBlob failed:", storagePath, e1);
        }

        try {
            const pathRef = storageRef(storage, storagePath);
            const buffer = await getBytes(pathRef);
            if (buffer && buffer.byteLength > 0) {
                return new Blob([buffer], { type: 'image/jpeg' });
            }
        } catch (e2) {
            console.warn("Firebase PathRef getBytes failed:", storagePath, e2);
        }
    }

    // Strategy 2: CodeTabs CORS Proxy
    try {
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
            const blob = await response.blob();
            if (blob && blob.size > 0) return blob;
        }
    } catch (err) {
        console.warn("CodeTabs proxy failed:", err);
    }

    // Strategy 3: CorsProxy.io Proxy
    try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
            const blob = await response.blob();
            if (blob && blob.size > 0) return blob;
        }
    } catch (err) {
        console.warn("CorsProxy.io failed:", err);
    }

    return null;
}

async function urlToDataUri(url: string): Promise<string> {
    if (!url || typeof url !== 'string' || url.trim().length === 0 || url.startsWith('data:image/')) {
        return url;
    }
    try {
        const blob = await fetchImageBlob(url);
        if (blob && blob.size > 0) {
            const b64 = await blobToBase64(blob);
            if (b64 && b64.startsWith('data:')) return b64;
        }
    } catch (e) {
        console.warn("urlToDataUri failed:", url, e);
    }
    return url;
}

// Wrap with 15s timeout so image conversion succeeds without timing out prematurely
async function urlToDataUriWithTimeout(url: string, timeoutMs = 15000): Promise<string> {
    return Promise.race([
        urlToDataUri(url),
        new Promise<string>((resolve) => setTimeout(() => resolve(url), timeoutMs))
    ]);
}

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
        paymentDetails?: ProgramData['paymentDetails'],
        onProgress?: (statusText: string, percent: number) => void
    ) => {
        onProgress?.("Filtering & preparing registration data...", 10);

        // Find unique receipt URLs to convert
        const urlsToConvert = Array.from(
            new Set(
                registrations
                    .map(r => r.paymentScreenshotUrl)
                    .filter((u): u is string => !!u && typeof u === 'string' && u.trim().length > 0 && !u.startsWith('data:'))
            )
        );

        const urlMap = new Map<string, string>();
        for (let i = 0; i < urlsToConvert.length; i++) {
            const origUrl = urlsToConvert[i];
            onProgress?.(`Processing Payment Proof Screenshot ${i + 1} of ${urlsToConvert.length}...`, Math.round(15 + ((i + 1) / urlsToConvert.length) * 45));
            const dataUri = await urlToDataUriWithTimeout(origUrl, 15000);
            urlMap.set(origUrl, dataUri);
        }

        const updatedRegistrations = registrations.map(reg => {
            if (reg.paymentScreenshotUrl && urlMap.has(reg.paymentScreenshotUrl)) {
                return { ...reg, paymentScreenshotUrl: urlMap.get(reg.paymentScreenshotUrl) };
            }
            return reg;
        });

        onProgress?.("Rendering template layout & Malayalam fonts...", 65);

        // 1. Render React component to static HTML string
        const htmlString = renderToString(
            <ProgramPdfTemplate
                registrations={updatedRegistrations}
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

        // 3. Create an invisible wrapper for DOM attachment (in-viewport for GPU image decoding)
        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.left = '0';
        wrapper.style.top = '0';
        wrapper.style.opacity = '0.01';
        wrapper.style.pointerEvents = 'none';
        wrapper.style.zIndex = '-9999';

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

            onProgress?.("Preloading & decoding image elements...", 78);

            // Force browser to decode all image bitmaps into GPU memory
            const images = Array.from(tempContainer.querySelectorAll('img'));
            if (images.length > 0) {
                await Promise.all(
                    images.map(async (img) => {
                        try {
                            if (img.decode) {
                                await img.decode();
                            }
                        } catch {
                            // ignore decode error if already decoded or fallback
                        }
                    })
                );
            }

            onProgress?.("Generating high-resolution document canvas...", 86);

            // 6. Generate canvas with html2canvas
            const canvas = await html2canvas(tempContainer, {
                scale: 3, // High resolution rendering
                useCORS: true,
                allowTaint: true,
                logging: false,
            });

            onProgress?.("Formatting A4 PDF pages & slicing layout...", 93);

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

            // Collect bounds of all elements that shouldn't be split mid-row/mid-card/mid-image
            const keepTogetherElements = Array.from(tempContainer.querySelectorAll('.pdf-keep-together, tr, h1, h2, h3, .pdf-header, img'));
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
                const renderedSliceHeightMm = (sliceHeight / canvas.width) * effectiveWidth;

                if (pageIndex > 0) {
                    pdf.addPage();
                }

                pdf.addImage(
                    sliceImgData,
                    'JPEG',
                    margin,
                    margin,
                    effectiveWidth,
                    renderedSliceHeightMm
                );

                currentY = targetY;
                pageIndex++;
            }

            onProgress?.("Saving PDF document...", 100);
            const fileName = `${programName.replace(/\s+/g, '_')}_Registrations_${role || 'all'}_${forane.replace(/\s+/g, '_')}_${parish.replace(/\s+/g, '_')}.pdf`;
            pdf.save(fileName);
        } finally {
            if (wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }
        }
    }
};
