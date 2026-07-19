import { ProgramRegistration, CustomField, ProgramData } from '../../../features/programs/services/programService';
import { UserData } from '../../../features/users/services/userService';

interface ProgramPdfTemplateProps {
    registrations: ProgramRegistration[];
    programName: string;
    forane: string;
    parish: string;
    users: UserData[];
    role?: 'student' | 'teacher';
    customFields?: CustomField[];
    paymentDetails?: ProgramData['paymentDetails'];
}

export const ProgramPdfTemplate = ({ 
    registrations, 
    programName, 
    forane, 
    parish, 
    users, 
    role = 'student', 
    customFields = [],
    paymentDetails
}: ProgramPdfTemplateProps) => {
    const todayDate = new Date().toISOString().split('T')[0];
    const isTeacher = role === 'teacher';

    // Calculate Summary Stats
    const totalCount = registrations.reduce((acc, reg) => acc + (reg.isCountOnly ? (reg.studentCount || 1) : 1), 0);
    const uniqueSchools = new Set(registrations.map(reg => reg.schoolUserId)).size;

    // Payment calculations
    const regFee = paymentDetails?.registrationFee || 0;
    const advType = paymentDetails?.advanceType || 'percentage';
    const advValue = paymentDetails?.advanceValue || 0;
    const advFeePerHead = advType === 'fixed' ? advValue : regFee * (advValue / 100);
    const totalExpectedFull = totalCount * regFee;
    const totalExpectedAdvance = totalCount * advFeePerHead;
    
    // Approved or Locked Total Received
    const approvedOrLockedRegs = registrations.filter(
        (reg) => reg.status === 'approved_parish' || reg.status === 'locked'
    );

    const totalApprovedCount = approvedOrLockedRegs.reduce((sum, reg) => {
        const count = reg.isCountOnly ? (reg.studentCount || 1) : 1;
        return sum + count;
    }, 0);

    // Geographic Grouping Logic with Totals
    const groupedData = registrations.reduce((acc: any, reg) => {
        const schoolInfo = users.find(u => u.uid === reg.schoolUserId || u.id === reg.schoolUserId);
        const regForane = schoolInfo?.forane || 'Unknown Forane';
        const regParish = reg.schoolName || 'Unknown Parish';
        const count = reg.isCountOnly ? (reg.studentCount || 1) : 1;

        if (!acc[regForane]) {
            acc[regForane] = { parishes: {}, total: 0 };
        }
        if (!acc[regForane].parishes[regParish]) {
            acc[regForane].parishes[regParish] = { regs: [], total: 0 };
        }

        acc[regForane].parishes[regParish].regs.push(reg);
        acc[regForane].parishes[regParish].total += count;
        acc[regForane].total += count;

        return acc;
    }, {});

    const sortedForanes = Object.keys(groupedData).sort();

    return (
        <div id="program-pdf-container" style={{
            padding: '22px 30px',
            backgroundColor: '#ffffff',
            width: '600px',
            minHeight: '825px',
            color: '#1a1a1a',
            fontFamily: "'Inter', Arial, sans-serif",
            boxSizing: 'border-box',
            position: 'relative',
        }}>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Malayalam:wght@400;700&display=swap');`}
            </style>

            {/* Premium Header Decoration */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }}></div>

            {/* Header Content */}
            <div style={{ marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '8px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>
                        Suvara Administrative Report
                    </div>
                    <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
                        {programName} <span style={{ color: '#6b7280', fontWeight: 400 }}>| Summary</span>
                    </h1>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '9px', color: '#4b5563', fontWeight: 500 }}>
                        <span><strong>Forane:</strong> {forane || 'All'}</span>
                        <span><strong>Parish:</strong> {parish || 'All'}</span>
                        <span><strong>Date:</strong> {todayDate}</span>
                    </div>
                </div>
                <div>
                    <div style={{ background: '#f8fafc', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '70px', textAlign: 'center' }}>
                        <div style={{ fontSize: '7px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>{isTeacher ? 'Total Teachers' : 'Total Students'}</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#2563eb' }}>{totalCount}</div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div style={{ padding: '11px', background: '#f1f5f9', borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <div style={{ width: '27px', height: '27px', borderRadius: '6px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <span style={{ fontSize: '14px' }}>🏫</span>
                    </div>
                    <div>
                        <div style={{ fontSize: '7px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Registered Schools</div>
                        <div style={{ fontSize: '12px', fontWeight: 800 }}>{uniqueSchools}</div>
                    </div>
                </div>

                <div style={{ padding: '11px', background: '#eff6ff', borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <div style={{ width: '27px', height: '27px', borderRadius: '6px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <span style={{ fontSize: '14px' }}>👥</span>
                    </div>
                    <div>
                        <div style={{ fontSize: '7px', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase' }}>Avg. Per School</div>
                        <div style={{ fontSize: '12px', fontWeight: 800 }}>{uniqueSchools > 0 ? (totalCount / uniqueSchools).toFixed(1) : 0}</div>
                    </div>
                </div>
            </div>

            {/* Payment Summary Box (Only if program has payment) */}
            {paymentDetails?.isRequired && (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1fr', 
                    gap: '12px', 
                    marginBottom: '18px',
                    padding: '12px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '9px'
                }}>
                    <div>
                        <div style={{ fontSize: '7px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Registration Fee</div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b' }}>
                            ₹{regFee} <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 500 }}>
                                (Adv: {advType === 'fixed' ? `₹${advValue}` : `${advValue}%`})
                            </span>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '7px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Expected Total (Full / Advance)</div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b' }}>
                            ₹{totalExpectedFull} / ₹{totalExpectedAdvance.toFixed(1)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '7px', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Total Approved</div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a' }}>
                            {totalApprovedCount} {isTeacher ? 'Teacher(s)' : 'Student(s)'}
                        </div>
                    </div>
                </div>
            )}

            {/* Grouped Data Display */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {sortedForanes.length === 0 ? (
                    <div style={{ padding: '22px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '9px' }}>
                        No registrations found matching the specified filters.
                    </div>
                ) : (
                    sortedForanes.map((fName) => (
                        <div key={fName} style={{ marginBottom: '8px' }}>
                            <div style={{
                                padding: '4px 11px',
                                background: '#1e293b',
                                color: '#fff',
                                borderRadius: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '9px',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                    Forane: {fName}
                                </span>
                                <span style={{ fontSize: '8px', fontWeight: 500, opacity: 0.9 }}>
                                    Total: {groupedData[fName].total} {isTeacher ? 'Teacher(s)' : 'Student(s)'}
                                </span>
                            </div>

                            {Object.keys(groupedData[fName].parishes).sort().map((pName) => (
                                <div key={pName} style={{ marginBottom: '11px', border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{
                                        padding: '7px 11px',
                                        background: '#f8fafc',
                                        borderBottom: '1px solid #f1f5f9',
                                        color: '#111827',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ fontWeight: 800, fontSize: '10px' }}>{pName}</span>
                                        <span style={{ fontSize: '8px', fontWeight: 600, color: '#3b82f6' }}>
                                            Count: {groupedData[fName].parishes[pName].total}
                                            {paymentDetails?.isRequired && ` | Expected: ₹${groupedData[fName].parishes[pName].total * regFee} (Adv: ₹${(groupedData[fName].parishes[pName].total * advFeePerHead).toFixed(0)})`}
                                        </span>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '8.5px', fontFamily: "'Noto Sans Malayalam', 'Inter', sans-serif" }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                                                <th style={{ padding: '6px 11px', width: '22px' }}>#</th>
                                                <th style={{ padding: '6px 11px' }}>{isTeacher ? 'Teacher Name' : 'Student Name'}</th>
                                                <th style={{ padding: '6px 11px' }}>Phone</th>
                                                {customFields.map(f => (
                                                    <th key={f.id} style={{ padding: '6px 11px' }}>{f.name}</th>
                                                ))}
                                                {paymentDetails?.isRequired && <th style={{ padding: '6px 11px', textAlign: 'center', width: '55px' }}>Payment</th>}
                                                {!isTeacher && <th style={{ padding: '6px 11px', textAlign: 'center', width: '45px' }}>Entry</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedData[fName].parishes[pName].regs.map((reg: any, i: number) => (
                                                <tr key={reg.id || i} style={{ borderBottom: i === groupedData[fName].parishes[pName].regs.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '6px 11px', color: '#94a3b8' }}>{i + 1}</td>
                                                    <td style={{ padding: '6px 11px', color: '#4b5563' }}>
                                                        {reg.isCountOnly ? (
                                                            <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: '7.5px', background: '#eff6ff', padding: '1px 4px', borderRadius: '2px' }}>
                                                                Count only
                                                            </span>
                                                        ) : (
                                                            reg.studentName || 'N/A'
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '6px 11px', color: '#4b5563' }}>
                                                        {reg.isCountOnly ? '-' : (reg.studentPhone || 'N/A')}
                                                    </td>
                                                    {customFields.map(field => {
                                                        const val = reg.customFieldValues?.[field.id];
                                                        let displayVal = "-";
                                                        if (val !== undefined && val !== null) {
                                                            if (typeof val === 'boolean') displayVal = val ? 'Yes' : 'No';
                                                            else displayVal = String(val);
                                                        }
                                                        return (
                                                            <td key={field.id} style={{ padding: '6px 11px', color: '#4b5563' }}>
                                                                {displayVal}
                                                            </td>
                                                        );
                                                    })}
                                                    {paymentDetails?.isRequired && (
                                                        <td style={{ padding: '6px 11px', textAlign: 'center', fontWeight: 600 }}>
                                                            {reg.paymentScreenshotUrl ? (
                                                                <span style={{ color: '#16a34a' }}>Paid</span>
                                                            ) : (
                                                                <span style={{ color: '#dc2626' }}>Unpaid</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    {!isTeacher && (
                                                        <td style={{ padding: '6px 11px', color: '#111827', fontWeight: 700, textAlign: 'center' }}>
                                                            {reg.isCountOnly ? reg.studentCount : ''}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>

            {/* Signature Area */}
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'center', width: '135px' }}>
                    <div style={{ height: '30px', borderBottom: '1px solid #e2e8f0', marginBottom: '4px' }}></div>
                    <div style={{ fontSize: '8px', fontWeight: 700, color: '#1a1a1a', textTransform: 'uppercase' }}>Administrator</div>
                    <div style={{ fontSize: '7px', color: '#64748b' }}>Eparchy of Kanjirapally</div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ position: 'absolute', bottom: '22px', left: '30px', right: '30px', borderTop: '1px solid #f1f5f9', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                <div>SUVARA NEXTGEN • {isTeacher ? 'TEACHER REGISTRY' : 'STUDENT REGISTRY'}</div>
                <div>GENERATED: {new Date().toLocaleString()}</div>
            </div>
        </div>
    );
};
