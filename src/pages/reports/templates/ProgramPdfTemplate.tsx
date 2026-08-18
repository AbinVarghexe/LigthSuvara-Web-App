import { ProgramRegistration, CustomField, ProgramData } from '../../../features/programs/services/programService';
import { UserData } from '../../../features/users/services/userService';

// Helper to format currency values cleanly without trailing .0 if integer
export const formatAmount = (num: number) => num % 1 === 0 ? num.toString() : num.toFixed(1);

export const formatTimestamp = (ts: any) => {
    if (!ts) return '';
    try {
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch {
        return '';
    }
};

export interface ProgramPdfSummaryHeaderProps {
    registrations: ProgramRegistration[];
    programName: string;
    forane: string;
    parish: string;
    role?: 'student' | 'teacher';
    paymentDetails?: ProgramData['paymentDetails'];
    dateFilter?: string;
}

export const ProgramPdfSummaryHeader = ({
    registrations,
    programName,
    forane,
    parish,
    role = 'student',
    paymentDetails,
    dateFilter = 'All'
}: ProgramPdfSummaryHeaderProps) => {
    const todayDate = new Date().toISOString().split('T')[0];
    const isTeacher = role === 'teacher';

    const totalCount = registrations.reduce((acc, reg) => acc + (reg.isCountOnly ? (reg.studentCount || 1) : 1), 0);
    const uniqueSchools = new Set(registrations.map(reg => reg.schoolUserId)).size;

    const regFee = paymentDetails?.registrationFee || 0;
    const advType = paymentDetails?.advanceType || 'percentage';
    const advValue = paymentDetails?.advanceValue || 0;
    const advFeePerHead = advType === 'fixed' ? advValue : regFee * (advValue / 100);
    const totalExpectedFull = totalCount * regFee;
    const totalExpectedAdvance = totalCount * advFeePerHead;

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

    const paidRegs = registrations.filter((reg) => !!reg.paymentScreenshotUrl);
    const totalPaidCount = paidRegs.reduce((sum, reg) => {
        const count = reg.isCountOnly ? (reg.studentCount || 1) : 1;
        return sum + count;
    }, 0);

    const totalActualPaidAdvance = totalPaidCount * advFeePerHead;

    return (
        <div style={{
            padding: '20px 30px 10px 30px',
            backgroundColor: '#ffffff',
            width: '600px',
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
                        {dateFilter && dateFilter !== 'All' && (
                            <span> &bull; Date: <span style={{ color: '#2563eb', fontWeight: 700 }}>{dateFilter}</span></span>
                        )}
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

            {/* Payment & Approval Summary Box */}
            {paymentDetails?.isRequired && (
                <div className="pdf-keep-together" style={{
                    padding: '8px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    marginBottom: '10px',
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
        </div>
    );
};

export interface ProgramPdfParishSectionProps {
    parishName: string;
    foraneName: string;
    parishRegs: ProgramRegistration[];
    totalCount: number;
    isTeacher: boolean;
    customFields: CustomField[];
    paymentDetails?: ProgramData['paymentDetails'];
}

export const ProgramPdfParishSection = ({
    parishName,
    foraneName,
    parishRegs,
    totalCount,
    isTeacher,
    customFields,
    paymentDetails,
}: ProgramPdfParishSectionProps) => {
    const regFee = paymentDetails?.registrationFee || 0;
    const advType = paymentDetails?.advanceType || 'percentage';
    const advValue = paymentDetails?.advanceValue || 0;
    const advFeePerHead = advType === 'fixed' ? advValue : regFee * (advValue / 100);

    const sortedRegs = [...parishRegs].sort((a, b) => {
        const nameA = a.studentName || '';
        const nameB = b.studentName || '';
        return nameA.localeCompare(nameB);
    });

    const parishPaidCount = sortedRegs
        .filter((r) => !!r.paymentScreenshotUrl)
        .reduce((sum, reg) => sum + (reg.isCountOnly ? (reg.studentCount || 1) : 1), 0);
    const parishPaidAdv = parishPaidCount * advFeePerHead;
    const parishExpectedAdv = totalCount * advFeePerHead;

    const earliestReg = sortedRegs.find((r) => !!r.submittedAt);
    const parishDateStr = earliestReg?.submittedAt ? formatTimestamp(earliestReg.submittedAt) : '';

    const parishProofUrls: string[] = Array.from(
        new Set<string>(
            sortedRegs
                .map((r) => r.paymentScreenshotUrl)
                .filter((url): url is string => !!url && typeof url === 'string' && url.trim().length > 0)
        )
    );

    return (
        <div style={{
            padding: '6px 30px 10px 30px',
            backgroundColor: '#ffffff',
            width: '600px',
            color: '#1a1a1a',
            fontFamily: "'Inter', Arial, sans-serif",
            boxSizing: 'border-box'
        }}>
            {/* Forane Header Banner */}
            <div className="pdf-keep-together" style={{
                padding: '5px 10px',
                background: '#1e293b',
                color: '#ffffff',
                borderRadius: '5px',
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontWeight: 800, fontSize: '10px', letterSpacing: '0.2px' }}>
                    FORANE: {foraneName.toUpperCase()}
                </span>
                <span style={{ fontSize: '8px', fontWeight: 500, opacity: 0.9 }}>
                    {parishName} &bull; {totalCount} {isTeacher ? 'Teacher(s)' : 'Student(s)'}
                </span>
            </div>

            <div style={{ marginBottom: '8px', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                <div className="pdf-keep-together" style={{
                    padding: '6px 10px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #f1f5f9',
                    color: '#111827',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '10px' }}>{parishName}</span>
                        {parishDateStr && (
                            <span style={{ fontSize: '7.5px', background: '#eff6ff', color: '#2563eb', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                                Submitted: {parishDateStr}
                            </span>
                        )}
                    </div>
                    <span style={{ fontSize: '8px', fontWeight: 600, color: '#3b82f6' }}>
                        Count: {totalCount}
                        {paymentDetails?.isRequired && ` | Paid Adv: ₹${formatAmount(parishPaidAdv)} / ₹${formatAmount(parishExpectedAdv)}`}
                    </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '8.5px', fontFamily: "'Noto Sans Malayalam', 'Inter', sans-serif" }}>
                    <thead>
                        <tr className="pdf-keep-together" style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                            <th style={{ padding: '5px 10px', width: '22px' }}>#</th>
                            <th style={{ padding: '5px 10px' }}>{isTeacher ? 'Teacher Name' : 'Student Name'}</th>
                            <th style={{ padding: '5px 10px' }}>Phone</th>
                            {customFields.map(f => (
                                <th key={f.id} style={{ padding: '5px 10px' }}>{f.name}</th>
                            ))}
                            {paymentDetails?.isRequired && <th style={{ padding: '5px 10px', textAlign: 'center', width: '55px' }}>Payment</th>}
                            {!isTeacher && <th style={{ padding: '5px 10px', textAlign: 'center', width: '45px' }}>Entry</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRegs.map((reg, i) => (
                            <tr key={reg.id || i} className="pdf-keep-together" style={{ borderBottom: i === sortedRegs.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                <td style={{ padding: '5px 10px', color: '#94a3b8' }}>{i + 1}</td>
                                <td style={{ padding: '5px 10px', color: '#4b5563' }}>
                                    {reg.isCountOnly ? (
                                        <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: '7.5px', background: '#eff6ff', padding: '1px 4px', borderRadius: '2px' }}>
                                            Count only
                                        </span>
                                    ) : (
                                        reg.studentName || 'N/A'
                                    )}
                                </td>
                                <td style={{ padding: '5px 10px', color: '#4b5563' }}>
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
                                        <td key={field.id} style={{ padding: '5px 10px', color: '#4b5563' }}>
                                            {displayVal}
                                        </td>
                                    );
                                })}
                                {paymentDetails?.isRequired && (
                                    <td style={{ padding: '5px 10px', textAlign: 'center', fontWeight: 600 }}>
                                        {reg.paymentScreenshotUrl ? (
                                            <span style={{ color: '#16a34a' }}>Paid</span>
                                        ) : (
                                            <span style={{ color: '#dc2626' }}>Unpaid</span>
                                        )}
                                    </td>
                                )}
                                {!isTeacher && (
                                    <td style={{ padding: '5px 10px', color: '#111827', fontWeight: 700, textAlign: 'center' }}>
                                        {reg.isCountOnly ? reg.studentCount : ''}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Fee Paid Proof Screenshots */}
                {paymentDetails?.isRequired && parishProofUrls.length > 0 && (
                    <div className="pdf-keep-together" style={{
                        padding: '8px 10px',
                        background: '#f8fafc',
                        borderTop: '1px solid #f1f5f9',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                            Fee Paid Proof ({parishProofUrls.length} {parishProofUrls.length === 1 ? 'Receipt' : 'Receipts'})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {parishProofUrls.map((url, idx) => {
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
        </div>
    );
};

export interface ProgramPdfTemplateProps {
    registrations: ProgramRegistration[];
    programName: string;
    forane: string;
    parish: string;
    users: UserData[];
    role?: 'student' | 'teacher';
    customFields?: CustomField[];
    paymentDetails?: ProgramData['paymentDetails'];
    dateFilter?: string;
    sortOrder?: 'forane' | 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'desc' | 'asc' | 'none';
}

export const ProgramPdfTemplate = ({ 
    registrations, 
    programName, 
    forane, 
    parish, 
    users, 
    role = 'student', 
    customFields = [],
    paymentDetails,
    dateFilter = 'All',
    sortOrder = 'forane'
}: ProgramPdfTemplateProps) => {
    // Group registrations by Parish key
    const parishMap = new Map<string, {
        parishName: string;
        foraneName: string;
        regs: ProgramRegistration[];
        totalCount: number;
        submissionTime: number;
        dateFormatted: string;
    }>();

    registrations.forEach((reg) => {
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

    return (
        <div id="program-pdf-container">
            <ProgramPdfSummaryHeader
                registrations={registrations}
                programName={programName}
                forane={forane}
                parish={parish}
                role={role}
                paymentDetails={paymentDetails}
                dateFilter={dateFilter}
            />
            {sortedParishesList.map((p) => (
                <ProgramPdfParishSection
                    key={p.parishName}
                    parishName={p.parishName}
                    foraneName={p.foraneName}
                    parishRegs={p.regs}
                    totalCount={p.totalCount}
                    isTeacher={isTeacher}
                    customFields={customFields}
                    paymentDetails={paymentDetails}
                />
            ))}
        </div>
    );
};
