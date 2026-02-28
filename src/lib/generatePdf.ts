import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateEventPdf(element: HTMLElement, filename = 'event-report.pdf') {
  if (!element) throw new Error('No element provided to generate PDF');

  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    scrollY: -window.scrollY,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > -10) {
    position = position - pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}

export default generateEventPdf;
