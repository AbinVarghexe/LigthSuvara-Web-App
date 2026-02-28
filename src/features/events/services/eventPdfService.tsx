import { renderToString } from "react-dom/server";
import { EventData } from "./eventService";
import { getUser } from "../../users/services/userService";
import { EventPdfTemplate } from "../../../pages/events/EventPdfTemplate";
// @ts-ignore
import html2pdf from "html2pdf.js";

/**
 * Helper to fetch an image and convert to base64.
 * This is more reliable for html2canvas than direct URLs.
 * Uses a CORS proxy fallback if the direct Firebase Storage URL blocks the canvas.
 */
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
    // Attempt 1: Standard CORS fetch which works locally but fails on Vercel sometimes
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`Direct fetch failed: ${response.statusText}`);
    const blob = await response.blob();
    return await blobToBase64(blob);
  } catch (error) {
    console.warn("Direct CORS fetch failed. Attempting URL rewrite for Firebase...", url);
    try {
      // Attempt 2: Firebase Storage URLs can sometimes be fetched without strict CORS 
      // by appending a random token or bypassing the proxy if it's public.
      // Alternatively, try a different reliable proxy just for production.
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
      const proxyResponse = await fetch(proxyUrl);
      if (!proxyResponse.ok) throw new Error(`Proxy fallback failed: ${proxyResponse.statusText}`);
      const proxyBlob = await proxyResponse.blob();
      return await blobToBase64(proxyBlob);
    } catch (proxyError) {
      console.error("Failed to fetch image for PDF via weserv proxy:", url, proxyError);

      // Final attempt: cross-origin fallback proxy
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

export const EventPdfService = {
  /**
   * Generates a premium PDF report for a single event using html2pdf.js.
   * Aligned with Marks.tsx implementation for maximum reliability.
   */
  generateEventPdf: async (event: EventData) => {
    // 1. Pre-fetch images to avoid blank spaces/CORS issues
    let eventImageBase64 = "";
    if (event.imageUrl) {
      eventImageBase64 = await fetchImageAsBase64(event.imageUrl);
    }

    // 1.5 Fetch creator name
    let creatorName = (event as any).creatorSchoolName || "Unknown";
    if (event.creatorId) {
      try {
        const user = await getUser(event.creatorId);
        if (user) {
          creatorName =
            (event as any).creatorSchoolName &&
              (event as any).creatorSchoolName !== "Admin"
              ? (event as any).creatorSchoolName
              : user.schoolName || user.schoolname || user.fullName || "Unknown";
        }
      } catch (error) {
        console.warn("Could not fetch user, using fallback name.");
      }
    }

    // 2. Render React component to static HTML string
    const htmlString = renderToString(
      <EventPdfTemplate
        event={event}
        creatorName={creatorName}
        eventImageBase64={eventImageBase64}
      />
    );

    // 3. Wrap in a full HTML document body
    const fullHtmlBody = `
      <div id="event-pdf-root">
        ${htmlString}
      </div>
    `;

    // 4. Create an invisible wrapper for DOM attachment
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';

    // 5. Create the actual container to be captured (NO absolute positioning here!)
    const tempContainer = document.createElement('div');
    tempContainer.style.width = '800px';
    tempContainer.style.background = 'white';

    // Inject fonts and content
    const fontCss = `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;700&display=swap');`;
    tempContainer.innerHTML = `<style>${fontCss}</style>${fullHtmlBody}`;

    wrapper.appendChild(tempContainer);
    document.body.appendChild(wrapper);

    try {
      // 6. Wait for fonts to be ready
      if ((document as any).fonts && (document as any).fonts.ready) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await document.fonts.ready;
      }

      // 7. Wait for images to load completely
      const imgs = Array.from(tempContainer.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(imgs.map(img => {
        return new Promise<void>((resolve) => {
          if (!img.src) return resolve();
          if (img.complete && img.naturalHeight !== 0) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }));

      // 8. Configure html2pdf options
      const opt = {
        margin: 10,
        filename: `Event_Report_${(event.title || 'event').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
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

      // 9. Generate and save PDF, capturing only the inner container
      await html2pdf().from(tempContainer).set(opt).save();
    } catch (error) {
      console.error('Professional event report generation failed:', error);
      throw error;
    } finally {
      // Cleanup
      try { document.body.removeChild(wrapper); } catch (e) { /* ignore */ }
    }
  },
};
