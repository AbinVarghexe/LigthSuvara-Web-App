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

import { ProgramPdfSummaryHeader, ProgramPdfParishSection, formatTimestamp } from "../../../pages/reports/templates/ProgramPdfTemplate";

// Helper to render any JSX element into an offscreen DOM and capture with html2canvas safely
async function renderJsxToCanvas(jsxElement: React.ReactElement): Promise<{ canvas: HTMLCanvasElement; protectedBounds: { topPx: number; bottomPx: number }[] }> {
    const htmlString = renderToString(jsxElement);
    const fullHtmlBody = `<div id="pg-pdf-chunk">${htmlString}</div>`;

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.opacity = '0.01';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.zIndex = '-9999';

    const tempContainer = document.createElement('div');
    tempContainer.style.width = '600px';
    tempContainer.style.background = 'white';

    const fontCss = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Malayalam:wght@400;700&display=swap');`;
    tempContainer.innerHTML = `<style>${fontCss}</style>${fullHtmlBody}`;

    wrapper.appendChild(tempContainer);
    document.body.appendChild(wrapper);

    try {
        if ((document as any).fonts && (document as any).fonts.ready) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            await document.fonts.ready;
        }

        const images = Array.from(tempContainer.querySelectorAll('img'));
        if (images.length > 0) {
            await Promise.all(
                images.map(async (img) => {
                    try {
                        if (img.decode) await img.decode();
                    } catch {
                        // ignore decode errors
                    }
                })
            );
        }

        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
        });

        const keepTogetherElements = Array.from(tempContainer.querySelectorAll('.pdf-keep-together, tr, h1, h2, h3, img'));
        const containerRect = tempContainer.getBoundingClientRect();
        const scaleFactor = canvas.width / (tempContainer.offsetWidth || 600);

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

        return { canvas, protectedBounds };
    } finally {
        if (wrapper.parentNode) {
            wrapper.parentNode.removeChild(wrapper);
        }
    }
}

export const PremiumProgramPdfService = {
    /**
     * Generates a premium PDF report for Program Registrations using global chronological sorting and segmented rendering.
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
        dateFilter?: string,
        sortOrder?: 'forane' | 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'desc' | 'asc' | 'none',
        onProgress?: (statusText: string, percent: number) => void
    ) => {
        onProgress?.("Filtering & preparing registration data...", 10);

        // Preload payment proof images to data URIs in parallel batches of 6
        const urlsToConvert = Array.from(
            new Set(
                registrations
                    .map(r => r.paymentScreenshotUrl)
                    .filter((u): u is string => !!u && typeof u === 'string' && u.trim().length > 0 && !u.startsWith('data:'))
            )
        );

        const urlMap = new Map<string, string>();
        const imageBatchSize = 6;
        for (let i = 0; i < urlsToConvert.length; i += imageBatchSize) {
            const batch = urlsToConvert.slice(i, i + imageBatchSize);
            const currentProcessed = Math.min(i + imageBatchSize, urlsToConvert.length);
            onProgress?.(`Processing Payment Proof Screenshots (${currentProcessed}/${urlsToConvert.length})...`, Math.round(10 + (currentProcessed / urlsToConvert.length) * 35));
            const results = await Promise.all(batch.map(url => urlToDataUriWithTimeout(url, 8000)));
            batch.forEach((url, idx) => {
                urlMap.set(url, results[idx]);
            });
        }

        const updatedRegistrations = registrations.map(reg => {
            if (reg.paymentScreenshotUrl && urlMap.has(reg.paymentScreenshotUrl)) {
                return { ...reg, paymentScreenshotUrl: urlMap.get(reg.paymentScreenshotUrl) };
            }
            return reg;
        });

        // Group registrations by Parish key and determine each parish's earliest submission timestamp
        const parishMap = new Map<string, {
            parishName: string;
            foraneName: string;
            regs: ProgramRegistration[];
            totalCount: number;
            submissionTime: number;
            dateFormatted: string;
        }>();

        updatedRegistrations.forEach((reg) => {
            const schoolInfo = users.find(u => u.uid === reg.schoolUserId || u.id === reg.schoolUserId);
            const regForane = schoolInfo?.forane || 'Unknown Forane';
            const regParish = reg.schoolName || 'Unknown Parish';
            const count = reg.isCountOnly ? (reg.studentCount || 1) : 1;
            const t = reg.submittedAt?.toMillis ? reg.submittedAt.toMillis() : (reg.submittedAt ? new Date(reg.submittedAt).getTime() : 0);
            const dStr = reg.submittedAt ? formatTimestamp(reg.submittedAt) : '';

            if (!parishMap.has(regParish)) {
                parishMap.set(regParish, {
                    parishName: regParish,
                    foraneName: regForane,
                    regs: [reg],
                    totalCount: count,
                    submissionTime: t,
                    dateFormatted: dStr
                });
            } else {
                const entry = parishMap.get(regParish)!;
                entry.regs.push(reg);
                entry.totalCount += count;
                if (t > 0 && (entry.submissionTime === 0 || t < entry.submissionTime)) {
                    entry.submissionTime = t;
                    entry.dateFormatted = dStr;
                }
            }
        });

        // Sort parishes globally by the selected sort order
        const sortedParishesList = Array.from(parishMap.values()).sort((a, b) => {
            if (sortOrder === 'forane') {
                const foraneComp = a.foraneName.localeCompare(b.foraneName);
                if (foraneComp !== 0) return foraneComp;
                return a.parishName.localeCompare(b.parishName);
            }
            if (sortOrder === 'name-asc') return a.parishName.localeCompare(b.parishName);
            if (sortOrder === 'name-desc') return b.parishName.localeCompare(a.parishName);
            if (sortOrder === 'date-asc') {
                if (a.submissionTime > 0 && b.submissionTime > 0 && a.submissionTime !== b.submissionTime) {
                    return a.submissionTime - b.submissionTime;
                }
                if (a.submissionTime > 0 && b.submissionTime === 0) return -1;
                if (b.submissionTime > 0 && a.submissionTime === 0) return 1;
                return a.parishName.localeCompare(b.parishName);
            }
            // date-desc (default)
            if (a.submissionTime > 0 && b.submissionTime > 0 && a.submissionTime !== b.submissionTime) {
                return b.submissionTime - a.submissionTime;
            }
            if (a.submissionTime > 0 && b.submissionTime === 0) return -1;
            if (b.submissionTime > 0 && a.submissionTime === 0) return 1;
            return a.parishName.localeCompare(b.parishName);
        });

        const isTeacher = role === 'teacher';

        onProgress?.("Rendering Summary Header...", 50);

        // Initialize A4 PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const margin = 10;
        const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
        const effectiveWidth = pdfWidth - (margin * 2); // 190mm

        let currentYInPageMm = margin;

        // 1. Render Summary Header Chunk
        const { canvas: headerCanvas } = await renderJsxToCanvas(
            <ProgramPdfSummaryHeader
                registrations={updatedRegistrations}
                programName={programName}
                forane={forane}
                parish={parish}
                role={role}
                paymentDetails={paymentDetails}
                dateFilter={dateFilter}
            />
        );

        const headerHeightMm = (headerCanvas.height * effectiveWidth) / headerCanvas.width;
        const headerImgData = headerCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(headerImgData, 'JPEG', margin, currentYInPageMm, effectiveWidth, headerHeightMm);
        currentYInPageMm += headerHeightMm + 2;

        // 2. Batch parishes into groups of 8 to render efficiently (10x faster while staying safely within canvas limits)
        const PARISH_CHUNK_SIZE = 8;
        const parishBatches: (typeof sortedParishesList)[] = [];
        for (let i = 0; i < sortedParishesList.length; i += PARISH_CHUNK_SIZE) {
            parishBatches.push(sortedParishesList.slice(i, i + PARISH_CHUNK_SIZE));
        }

        for (let bIdx = 0; bIdx < parishBatches.length; bIdx++) {
            const batch = parishBatches[bIdx];
            const startNum = bIdx * PARISH_CHUNK_SIZE + 1;
            const endNum = Math.min((bIdx + 1) * PARISH_CHUNK_SIZE, sortedParishesList.length);
            const progressPercent = Math.round(55 + ((bIdx + 1) / parishBatches.length) * 40);
            onProgress?.(`Rendering Parishes ${startNum}–${endNum} of ${sortedParishesList.length}...`, progressPercent);

            const { canvas: batchCanvas, protectedBounds } = await renderJsxToCanvas(
                <div>
                    {batch.map((p) => (
                        <ProgramPdfParishSection
                            key={p.parishName}
                            parishName={p.parishName}
                            foraneName={p.foraneName}
                            parishRegs={p.regs}
                            totalCount={p.totalCount}
                            isTeacher={isTeacher}
                            customFields={customFields || []}
                            paymentDetails={paymentDetails}
                        />
                    ))}
                </div>
            );

            let sectionCurrentY = 0;
            const sectionTotalCanvasHeight = batchCanvas.height;

            while (sectionCurrentY < sectionTotalCanvasHeight) {
                const spaceLeftInPageMm = (pdfHeight - margin) - currentYInPageMm;

                // If less than 35mm space left on current page, start on a fresh page
                if (spaceLeftInPageMm < 35) {
                    pdf.addPage();
                    currentYInPageMm = margin;
                }

                const maxSliceHeightMm = (pdfHeight - margin) - currentYInPageMm;
                const maxSliceCanvasHeight = (maxSliceHeightMm / effectiveWidth) * batchCanvas.width;

                let targetY = sectionCurrentY + maxSliceCanvasHeight;

                if (targetY < sectionTotalCanvasHeight) {
                    // Avoid cutting table rows / cards in half
                    for (const bound of protectedBounds) {
                        if (bound.topPx < targetY && bound.bottomPx > targetY) {
                            if (bound.topPx - sectionCurrentY >= maxSliceCanvasHeight * 0.45) {
                                targetY = bound.topPx;
                                break;
                            }
                        }
                    }
                } else {
                    targetY = sectionTotalCanvasHeight;
                }

                if (targetY <= sectionCurrentY + 30) {
                    targetY = Math.min(sectionTotalCanvasHeight, sectionCurrentY + maxSliceCanvasHeight);
                }

                const sliceHeight = targetY - sectionCurrentY;
                if (sliceHeight <= 0) break;

                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = batchCanvas.width;
                sliceCanvas.height = sliceHeight;
                const ctx = sliceCanvas.getContext('2d');

                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                    ctx.drawImage(
                        batchCanvas,
                        0, sectionCurrentY, batchCanvas.width, sliceHeight,
                        0, 0, batchCanvas.width, sliceHeight
                    );
                }

                const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
                const renderedSliceHeightMm = (sliceHeight / batchCanvas.width) * effectiveWidth;

                pdf.addImage(
                    sliceImgData,
                    'JPEG',
                    margin,
                    currentYInPageMm,
                    effectiveWidth,
                    renderedSliceHeightMm
                );

                currentYInPageMm += renderedSliceHeightMm;
                sectionCurrentY = targetY;

                // If there's more content in this batch, prepare next page
                if (sectionCurrentY < sectionTotalCanvasHeight) {
                    pdf.addPage();
                    currentYInPageMm = margin;
                }
            }
        }

        onProgress?.("Saving PDF document...", 100);
        const fileName = `${programName.replace(/\s+/g, '_')}_Registrations_${role || 'all'}_${forane.replace(/\s+/g, '_')}_${parish.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
    }
};
