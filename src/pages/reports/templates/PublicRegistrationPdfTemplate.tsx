import { format } from "date-fns";

interface PublicRegistrationPdfTemplateProps {
    registrations: any[];
    programName: string;
    fields: any[];
    logoBase64?: string;
    selectedProgramId: string;
}

export const PublicRegistrationPdfTemplate = ({
    registrations,
    programName,
    fields,
    logoBase64,
    selectedProgramId
}: PublicRegistrationPdfTemplateProps) => {
    const todayDate = format(new Date(), "yyyy-MM-dd HH:mm");

    const getFieldValue = (reg: any, fieldId: string) => {
        if (reg[fieldId] !== undefined) return String(reg[fieldId]);
        if (reg.customFieldValues && reg.customFieldValues[fieldId] !== undefined) {
            const val = reg.customFieldValues[fieldId];
            if (typeof val === 'boolean') return val ? 'Yes' : 'No';
            return String(val);
        }
        if (fieldId === 'phone' && reg.applicantMobile) return reg.applicantMobile;
        if (fieldId === 'name' && reg.applicantName) return reg.applicantName;
        if (fieldId === 'address' && reg.applicantPlace) return reg.applicantPlace;
        if (fieldId === 'academicBackground' && reg.applicantClass) return reg.applicantClass;
        return "";
    };

    // Determine the columns to display
    let headers: { id: string; name: string }[] = [];
    if (selectedProgramId !== "all") {
        headers = fields.map(f => ({ id: f.id, name: f.name }));
    } else {
        headers = [
            { id: 'name', name: 'Name' },
            { id: 'phone', name: 'Phone' },
            { id: 'email', name: 'Email' },
            { id: 'qualification', name: 'Qualification' },
            { id: 'currentStatus', name: 'Status/Occupation' },
            { id: 'address', name: 'Address' },
            { id: 'programTitle', name: 'Program' }
        ];
    }

    return (
        <div id="public-reg-pdf-container" style={{
            padding: '24px 30px',
            backgroundColor: '#ffffff',
            width: '600px',
            minHeight: '825px',
            color: '#1e293b',
            fontFamily: "'Inter', Arial, sans-serif",
            boxSizing: 'border-box',
            position: 'relative'
        }}>
            {/* Top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #1e3a8a, #4f46e5)' }}></div>

            {/* Header section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '2px solid #f1f5f9',
                marginBottom: '20px'
            }}>
                {logoBase64 && (
                    <img
                        src={logoBase64}
                        alt="Suvara Logo"
                        style={{ height: '50px', marginRight: '16px', objectFit: 'contain' }}
                    />
                )}
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.5px', marginBottom: '2px' }}>
                        SUVARA
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Centre for Catechisis, Eparchy of Kanjirapally
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                        Registration Report
                    </span>
                </div>
            </div>

            {/* Sub-header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', fontSize: '11px' }}>
                <div>
                    <div style={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '9px', marginBottom: '2px' }}>Program / Filter</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{programName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '9px', marginBottom: '2px' }}>Generated Date</div>
                    <div style={{ fontWeight: 600, color: '#334155' }}>{todayDate}</div>
                </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Total Registrations</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a' }}>{registrations.length}</div>
                </div>
            </div>

            {/* Registrations Table */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                            <th style={{ padding: '8px 10px', width: '25px' }}>#</th>
                            {headers.map(h => (
                                <th key={h.id} style={{ padding: '8px 10px' }}>{h.name}</th>
                            ))}
                            <th style={{ padding: '8px 10px', width: '60px' }}>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrations.length === 0 ? (
                            <tr>
                                <td colSpan={headers.length + 2} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                    No registrations found.
                                </td>
                            </tr>
                        ) : (
                            registrations.map((reg, index) => (
                                <tr key={reg.id || index} style={{ borderBottom: index === registrations.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px 10px', color: '#94a3b8', verticalAlign: 'top' }}>{index + 1}</td>
                                    {headers.map(h => (
                                        <td key={h.id} style={{ 
                                            padding: '8px 10px', 
                                            color: '#334155', 
                                            wordBreak: 'break-word',
                                            whiteSpace: 'normal',
                                            verticalAlign: 'top'
                                        }}>
                                            {getFieldValue(reg, h.id) || '—'}
                                        </td>
                                    ))}
                                    <td style={{ padding: '8px 10px', color: '#64748b', verticalAlign: 'top' }}>
                                        {reg.timestamp ? format(reg.timestamp.toDate(), "dd MMM yy") : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Signature & Sign-off */}
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                    System generated report • Eparchy of Kanjirapally
                </div>
                <div style={{ textAlign: 'center', width: '135px' }}>
                    <div style={{ height: '30px', borderBottom: '1px solid #e2e8f0', marginBottom: '4px' }}></div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#0f172a' }}>Director</div>
                    <div style={{ fontSize: '8px', color: '#64748b' }}>Centre for Catechisis</div>
                </div>
            </div>
        </div>
    );
};
