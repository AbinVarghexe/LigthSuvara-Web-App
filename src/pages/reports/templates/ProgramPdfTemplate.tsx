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

    // Helper to format currency values cleanly without trailing .0 if integer
    const formatAmount = (num: number) => num % 1 === 0 ? num.toString() : num.toFixed(1);

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
    
    // Approved and Unapproved (Pending / Rejected) Registrations
    const approvedOrLockedRegs = registrations.filter(
        (reg) => reg.status === 'approved_parish' || reg.status === 'locked'
    );
    const unapprovedRegs = registrations.filter(
        (reg) => reg.status !== 'approved_parish' && reg.status !== 'locked'
    );

    const totalApprovedCount = approvedOrLockedRegs.reduce((sum, reg) => {
        const count = reg.isCountOnly ? (reg.studentCount || 1) : 1;
        return sum + count;
    }, 0);

    const totalUnapprovedCount = unapprovedRegs.reduce((sum, reg) => {
        const count = reg.isCountOnly ? (reg.studentCount || 1) : 1;
        return sum + count;
    }, 0);

    // Paid Registrations and Actual Paid Amount
    const paidRegs = registrations.filter((reg) => !!reg.paymentScreenshotUrl);
    const totalPaidCount = paidRegs.reduce((sum, reg) => {
        const count = reg.isCountOnly ? (reg.studentCount || 1) : 1;
        return sum + count;
    }, 0);

    const totalActualPaidAdvance = totalPaidCount * advFeePerHead;

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
            boxSizing: 'border-box'
        }}>
            {/* Minimal Compact Header */}
            <div className="pdf-keep-together" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #2563eb',
                paddingBottom: '10px',
                marginBottom: '14px'
            }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', margin: 0, letterSpacing: '-0.3px' }}>
                        {programName}
                    </h1>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                        Registration Report &bull; {isTeacher ? 'Teachers' : 'Students'} &bull; Forane: <span style={{ color: '#0f172a', fontWeight: 700 }}>{forane}</span> &bull; Parish: <span style={{ color: '#0f172a', fontWeight: 700 }}>{parish}</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '8px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Generated Date
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#1e293b' }}>
                        {todayDate}
                    </div>
                </div>
            </div>

            {/* Statistics Cards Grid */}
            <div className="pdf-keep-together" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                <div style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Registered</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '1px' }}>{totalCount}</div>
                    <div style={{ fontSize: '7.5px', color: '#64748b', marginTop: '1px' }}>Across {uniqueSchools} Parishes</div>
                </div>

                <div style={{ padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
                    <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Approved Count</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#15803d', marginTop: '1px' }}>{totalApprovedCount}</div>
                    <div style={{ fontSize: '7.5px', color: '#166534', marginTop: '1px' }}>{totalUnapprovedCount > 0 ? `${totalUnapprovedCount} Unapproved` : 'All Approved'}</div>
                </div>

                {paymentDetails?.isRequired ? (
                    <>
                        <div style={{ padding: '8px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px' }}>
                            <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>Expected Advance</div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1d4ed8', marginTop: '1px' }}>₹{formatAmount(totalExpectedAdvance)}</div>
                            <div style={{ fontSize: '7.5px', color: '#1e40af', marginTop: '1px' }}>₹{formatAmount(advFeePerHead)} / head ({advValue}{advType === 'percentage' ? '%' : ' fixed'})</div>
                        </div>

                        <div style={{ padding: '8px 10px', background: '#fefce8', border: '1px solid #fef08a', borderRadius: '6px' }}>
                            <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#854d0e', textTransform: 'uppercase' }}>Actual Paid Adv</div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#a16207', marginTop: '1px' }}>₹{formatAmount(totalActualPaidAdvance)}</div>
                            <div style={{ fontSize: '7.5px', color: '#854d0e', marginTop: '1px' }}>{totalPaidCount} / {totalCount} Heads Paid</div>
                        </div>
                    </>
                ) : (
                    <div style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Payment Requirement</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginTop: '2px' }}>Free Program (No Fee)</div>
                    </div>
                )}
            </div>

            {/* Payment & Approval Summary Box (Only if program has payment) */}
            {paymentDetails?.isRequired && (
                <div className="pdf-keep-together" style={{
                    padding: '8px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    marginBottom: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '8.5px'
                }}>
                    <div>
                        <span style={{ fontWeight: 700, color: '#334155' }}>Program Fee Structure: </span>
                        <span style={{ color: '#475569' }}>Total Fee: ₹{formatAmount(regFee)} per head | Advance Required: ₹{formatAmount(advFeePerHead)}</span>
                    </div>
                    <div>
                        <span style={{ fontWeight: 700, color: '#334155' }}>Total Expected Full: </span>
                        <span style={{ fontWeight: 800, color: '#2563eb' }}>₹{formatAmount(totalExpectedFull)}</span>
                    </div>
                </div>
            )}

            {/* Geographic Data View (Grouped by Forane & Parish) */}
            {sortedForanes.map((fName) => (
                <div key={fName} style={{ marginBottom: '16px' }}>
                    {/* Forane Header Banner */}
                    <div className="pdf-keep-together" style={{
                        padding: '6px 10px',
                        background: '#1e293b',
                        color: '#ffffff',
                        borderRadius: '5px',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '0.2px' }}>
                            FORANE: {fName.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '8px', fontWeight: 500, opacity: 0.9 }}>
                            Total: {groupedData[fName].total} {isTeacher ? 'Teacher(s)' : 'Student(s)'}
                        </span>
                    </div>

                    {Object.keys(groupedData[fName].parishes).sort().map((pName) => {
                        const parishRegs = groupedData[fName].parishes[pName].regs;
                        const parishPaidCount = parishRegs
                            .filter((r: any) => r.paymentScreenshotUrl)
                            .reduce((sum: number, reg: any) => sum + (reg.isCountOnly ? (reg.studentCount || 1) : 1), 0);
                        const parishPaidAdv = parishPaidCount * advFeePerHead;
                        const parishExpectedAdv = groupedData[fName].parishes[pName].total * advFeePerHead;

                        // Deduplicate payment proof URLs for this parish so shared screenshots are rendered only once
                        const parishProofUrls: string[] = Array.from(
                            new Set<string>(
                                parishRegs
                                    .map((r: any) => r.paymentScreenshotUrl)
                                    .filter((url: string | undefined): url is string => !!url && typeof url === 'string' && url.trim().length > 0)
                            )
                        );

                        return (
                            <div key={pName} style={{ marginBottom: '11px', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                                <div className="pdf-keep-together" style={{
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
                                        {paymentDetails?.isRequired && ` | Paid Adv: ₹${formatAmount(parishPaidAdv)} / ₹${formatAmount(parishExpectedAdv)}`}
                                    </span>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '8.5px', fontFamily: "'Noto Sans Malayalam', 'Inter', sans-serif" }}>
                                    <thead>
                                        <tr className="pdf-keep-together" style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
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
                                        {parishRegs.map((reg: any, i: number) => (
                                            <tr key={reg.id || i} className="pdf-keep-together" style={{ borderBottom: i === parishRegs.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
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

                                {/* Fee Paid Proof Screenshots (Deduplicated per Parish) */}
                                {paymentDetails?.isRequired && parishProofUrls.length > 0 && (
                                    <div className="pdf-keep-together" style={{
                                        padding: '8px 11px',
                                        background: '#f8fafc',
                                        borderTop: '1px solid #f1f5f9',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                                            Fee Paid Proof ({parishProofUrls.length} {parishProofUrls.length === 1 ? 'Receipt' : 'Receipts'})
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {parishProofUrls.map((url: string, idx: number) => {
                                                const isDataUri = url.startsWith('data:');
                                                return (
                                                    <div key={idx} style={{ 
                                                        border: '1px solid #cbd5e1', 
                                                        borderRadius: '6px', 
                                                        background: '#ffffff', 
                                                        padding: '6px',
                                                        display: 'inline-block',
                                                        maxWidth: '520px',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)' 
                                                    }}>
                                                        <img 
                                                            src={url} 
                                                            alt={`Payment Proof ${idx + 1}`} 
                                                            {...(!isDataUri ? { crossOrigin: "anonymous" } : {})}
                                                            style={{ 
                                                                maxHeight: '260px', 
                                                                maxWidth: '510px',
                                                                height: '240px',
                                                                width: 'auto',
                                                                display: 'block', 
                                                                borderRadius: '4px' 
                                                            }} 
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};
