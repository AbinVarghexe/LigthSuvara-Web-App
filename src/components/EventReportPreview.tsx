import React, { useRef } from 'react';
import generateEventPdf from '../lib/generatePdf';

export default function EventReportPreview() {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleGenerate = async () => {
    if (!ref.current) return;
    try {
      await generateEventPdf(ref.current, 'EventReport.pdf');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('PDF generation failed', err);
      alert('PDF generation failed - see console for details');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 12 }}>
        <button onClick={handleGenerate} style={{ padding: '8px 14px', background: '#1b7fcc', color: '#fff', borderRadius: 6, border: 'none' }}>
          Generate PDF
        </button>
      </div>

      <div ref={ref} className="pdf-report-root" style={{ maxWidth: 820, margin: '0 auto', padding: 24, border: '1px solid #e6eef6', borderRadius: 10 }}>
        <div style={{ borderBottom: '1px solid #e0e7ef', paddingBottom: 12 }}>
          <div className="pdf-header">Sunday School Event Report</div>
          <div className="pdf-subtitle">Catholic Student Movement Inauguration</div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }} className="pdf-image-holder">
          <img src="https://picsum.photos/800/360" alt="poster" />
        </div>

        <div className="pdf-two-cols">
          <div className="pdf-col pdf-card" style={{ marginTop: 18 }}>
            <div className="pdf-section-title">Event Details</div>
            <div><strong>Date & Time:</strong> February 22, 2026, 1:30 PM</div>
            <div><strong>Venue/Place:</strong> Kanjirapally</div>
            <div><strong>Category:</strong> SUVARA</div>
          </div>

          <div className="pdf-col pdf-card" style={{ marginTop: 18 }}>
            <div className="pdf-section-title">Creation Info</div>
            <div><strong>Report Generated:</strong> 2026-02-28</div>
            <div><strong>Created By:</strong> St Dominics Kanjirapally</div>
          </div>
        </div>

        <div className="pdf-event-description">
          <div className="pdf-section-title">Event Description</div>
          <p>
            This is a sample event description. Malayalam example below:
          </p>
          <p style={{ fontSize: 15 }}>
            സമ്പർക്ക വിവരങ്ങൾ: ഈ പരിപാടി 22 ഫെബ്രുവരി 2026 ന് നടന്നതായി റിപ്പോർട്ട് രേഖപ്പെടുത്തിയിരിക്കുന്നു. എല്ലാ പങ്കാളികൾക്കും നന്ദി.
          </p>
        </div>
      </div>
    </div>
  );
}
