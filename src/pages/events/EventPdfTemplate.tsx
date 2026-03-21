import { EventData } from '../../features/events/services/eventService';

interface EventPdfTemplateProps {
    event: EventData;
    editorName?: string;
    eventImageBase64?: string;
}

export const EventPdfTemplate = ({ event, editorName, eventImageBase64 }: EventPdfTemplateProps) => {
    const fmtDate = (date: any): string => {
        if (!date) return "N/A";
        const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
        if (isNaN(d.getTime())) return "N/A";
        return d.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    };

    const todayDate = new Date().toISOString().split('T')[0];

    return (
        <div id="event-pdf-container" style={{
            padding: '50px 60px',
            backgroundColor: '#ffffff',
            width: '800px',
            minHeight: '1000px',
            color: '#0f172a',
            fontFamily: "'Inter', Arial, sans-serif",
            boxSizing: 'border-box',
            position: 'relative',
            transform: 'scale(0.93)',
            transformOrigin: 'top left'
        }}>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Malayalam:wght@400;700&display=swap');`}
            </style>

            {/* Top Accent Line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', backgroundColor: '#2563eb' }}></div>

            {/* Header Area */}
            <div style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '680px', boxSizing: 'border-box' }}>
                <div style={{ width: '100%' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px' }}>
                        Official Document
                    </div>
                    <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.8px', lineHeight: '1.2' }}>
                        {event?.title || 'Untitled Event'}
                    </h1>
                    <div style={{ fontSize: '18px', color: '#64748b', fontWeight: 500, borderLeft: '3px solid #cbd5e1', paddingLeft: '12px', marginTop: '12px' }}>
                        Event Summary & Report
                    </div>
                </div>
            </div>

            {/* Event Image */}
            <div style={{
                width: '680px',
                boxSizing: 'border-box',
                marginBottom: '40px',
                borderRadius: '16px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '150px' // reduced min height so it doesn't leave huge gaps if empty
            }}>
                {eventImageBase64 || event?.imageUrl ? (
                    <img
                        src={eventImageBase64 || event.imageUrl}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '440px',
                            objectFit: 'contain',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0'
                        }}
                        alt="Event"
                        {...(!eventImageBase64 && event.imageUrl ? { crossOrigin: 'anonymous' } : {})}
                    />
                ) : (
                    <div style={{ padding: '60px 0', color: '#94a3b8', fontSize: '15px', fontStyle: 'italic', fontWeight: 500 }}>
                        No photographic record provided.
                    </div>
                )}
            </div>

            {/* Info Cards Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', width: '680px', boxSizing: 'border-box' }}>
                {/* Event Details Card */}
                <div style={{
                    width: '330px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    borderTop: '4px solid #3b82f6',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    boxSizing: 'border-box'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px 0', color: '#64748b', width: '100px', borderBottom: '1px solid #f1f5f9' }}>Date & Time</td>
                                <td style={{ padding: '8px 0', color: '#1e293b', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{fmtDate(event?.date)}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 0', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Venue</td>
                                <td style={{ padding: '10px 0', color: '#1e293b', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{event?.place || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 0', color: '#64748b' }}>Category</td>
                                <td style={{ padding: '10px 0', color: '#1e293b', fontWeight: 600 }}>
                                    <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {event?.category || 'N/A'}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Creation Info Card */}
                <div style={{
                    width: '330px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    borderTop: '4px solid #10b981',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    boxSizing: 'border-box'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px 0', color: '#64748b', width: '130px', borderBottom: '1px solid #f1f5f9' }}>Report Generated</td>
                                <td style={{ padding: '8px 0', color: '#1e293b', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{todayDate}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0', color: '#64748b' }}>Last Edited By</td>
                                <td style={{ padding: '8px 0', color: '#1e293b', fontWeight: 600 }}>{editorName || (event as any).creatorSchoolName || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Event Description */}
            <div style={{ width: '680px', boxSizing: 'border-box', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '28px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Event Log
                </h2>

                <div style={{
                    fontSize: '15px',
                    lineHeight: '1.6',
                    color: '#334155',
                    whiteSpace: 'pre-wrap',
                    textAlign: 'justify',
                    fontFamily: "'Noto Sans Malayalam', 'Inter', Arial, sans-serif"
                }}>
                    {event?.description || 'No detailed description was recorded for this event.'}
                </div>
            </div>

            {/* Footer */}
            <div style={{ width: '680px', boxSizing: 'border-box', marginTop: '60px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                <div style={{ textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>SUVARA • Official Administrative System</div>
                <div>{new Date().getFullYear()} © Eparchy of Kanjirapally</div>
            </div>
        </div>
    );
};
