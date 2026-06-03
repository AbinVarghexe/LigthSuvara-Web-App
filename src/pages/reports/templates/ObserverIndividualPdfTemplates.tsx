

// Common header for both reports
const CommonHeader = ({ logoBase64, title }: { logoBase64?: string, title: string }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        paddingBottom: '24px',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '32px'
    }}>
        {logoBase64 && (
            <img
                src={logoBase64}
                alt="Suvara Logo"
                style={{ height: '70px', marginRight: '24px', objectFit: 'contain' }}
            />
        )}
        <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '1px', marginBottom: '4px' }}>
                SUVARA
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Centre for Catechisis, Eparchy of Kanjirapally
            </div>
            <div style={{ marginTop: '8px', display: 'inline-block', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                {title}
            </div>
        </div>
    </div>
);

// --- Duty Order Template (For Observer) ---
export const ObserverDutyOrderPdfTemplate = ({ assignment, logoBase64, eventDate }: any) => {
    const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div id="observer-duty-pdf" style={{
            padding: '40px 50px',
            backgroundColor: '#ffffff',
            width: '600px', // Scaling to 600px for precise A4 fitting
            color: '#0f172a',
            fontFamily: "'Inter', Arial, sans-serif",
            boxSizing: 'border-box',
            position: 'relative'
        }}>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}
            </style>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #1e40af, #3b82f6)' }}></div>

            <CommonHeader logoBase64={logoBase64} title="Observer Duty Order" />

            <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748b', marginBottom: '40px', fontWeight: 500 }}>
                Date: {todayDate}
            </div>

            <div style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155', marginBottom: '32px' }}>
                <p style={{ marginBottom: '20px' }}>Dear <strong>{assignment.teacherName}</strong>,</p>
                <p style={{ marginBottom: '20px', textAlign: 'justify' }}>
                    Greetings from the Centre for Catechisis, Eparchy of Kanjirapally. We are pleased to appoint you as the <strong>External Observer</strong> for the Suvara examination for the academic year <strong>{assignment.academicYear}</strong>.
                </p>
                <p style={{ marginBottom: '20px' }}>
                    Your assigned duty station is:
                </p>

                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 24px', margin: '24px 0', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                        {assignment.targetSchoolName}
                    </div>
                    {eventDate && (
                        <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong>Date of Examination:</strong> {new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    )}
                </div>

                <p style={{ marginBottom: '20px' }}>
                    To access the Suvara system and submit your observation report, please use the following secure access code:
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
                    <div style={{ backgroundColor: '#eff6ff', border: '2px dashed #93c5fd', borderRadius: '12px', padding: '16px 32px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#60a5fa', letterSpacing: '1px', marginBottom: '8px' }}>
                            Your Access Code
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: '#1d4ed8', letterSpacing: '4px' }}>
                            {assignment.accessCode}
                        </div>
                    </div>
                </div>

                <p style={{ marginBottom: '20px', textAlign: 'justify' }}>
                    Kindly ensure your presence at the assigned venue on time and uphold the integrity of the examination process.
                </p>
                <p>May God bless your service.</p>
            </div>

            <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #cbd5e1', width: '160px', marginBottom: '8px' }}></div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Director</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Centre for Catechisis</div>
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: '30px', left: 0, right: 0, textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                This is a system generated document. Office Copy REF: {assignment.id.substring(0, 8)}
            </div>
        </div>
    );
};

// --- Admin Report Template (For Office) ---
export const ObserverAdminPdfTemplate = ({ assignment, logoBase64, eventDate }: any) => {
    const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div id="observer-admin-pdf" style={{
            padding: '40px 50px',
            backgroundColor: '#ffffff',
            width: '600px',
            color: '#0f172a',
            fontFamily: "'Inter', Arial, sans-serif",
            boxSizing: 'border-box',
            position: 'relative'
        }}>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}
            </style>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #475569, #0f172a)' }}></div>

            <CommonHeader logoBase64={logoBase64} title="Assignment Record (Admin)" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Record ID</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{assignment.id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Generated On</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{todayDate}</div>
                </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '32px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>
                    Assignment Details
                </div>
                <div style={{ padding: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '10px 0', color: '#64748b', width: '140px', borderBottom: '1px dashed #e2e8f0' }}>Observer Name</td>
                                <td style={{ padding: '10px 0', color: '#0f172a', fontWeight: 700, borderBottom: '1px dashed #e2e8f0', fontSize: '15px' }}>{assignment.teacherName}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '12px 0 10px', color: '#64748b', borderBottom: '1px dashed #e2e8f0' }}>Home Parish/School</td>
                                <td style={{ padding: '12px 0 10px', color: '#334155', fontWeight: 500, borderBottom: '1px dashed #e2e8f0' }}>{assignment.sourceSchoolName}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '12px 0 10px', color: '#64748b', borderBottom: '1px dashed #e2e8f0' }}>Assigned School</td>
                                <td style={{ padding: '12px 0 10px', color: '#1d4ed8', fontWeight: 700, borderBottom: '1px dashed #e2e8f0', fontSize: '15px' }}>{assignment.targetSchoolName}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '12px 0 10px', color: '#64748b', borderBottom: '1px dashed #e2e8f0' }}>Academic Year</td>
                                <td style={{ padding: '12px 0 10px', color: '#334155', fontWeight: 600, borderBottom: '1px dashed #e2e8f0' }}>{assignment.academicYear}</td>
                            </tr>
                            {eventDate && (
                                <tr>
                                    <td style={{ padding: '12px 0 10px', color: '#64748b', borderBottom: '1px dashed #e2e8f0' }}>Event Expiration</td>
                                    <td style={{ padding: '12px 0 10px', color: '#334155', fontWeight: 600, borderBottom: '1px dashed #e2e8f0' }}>{new Date(eventDate).toLocaleDateString()}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', backgroundColor: '#f8fafc' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '8px' }}>Security Code</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '2px', fontFamily: 'monospace' }}>{assignment.accessCode}</div>
                </div>
                <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '8px' }}>Status</div>
                    <div style={{ display: 'inline-block', backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, border: '1px solid #bbf7d0', alignSelf: 'flex-start' }}>ACTIVE ASSIGNMENT</div>
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: '30px', left: 0, right: 0, textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                Internal Administrative Document • Not for public distribution
            </div>
        </div>
    );
};

// --- Submission Report Template (For Observer Report Export) ---
export const ObserverSubmissionReportPdfTemplate = ({ assignment, logoBase64 }: any) => {
    const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const submissionDate = assignment.remarksSubmittedAt
        ? new Date((assignment.remarksSubmittedAt.seconds || assignment.remarksSubmittedAt) * 1000).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'N/A';

    return (
        <div id="observer-submission-pdf" style={{
            padding: '40px 50px',
            backgroundColor: '#ffffff',
            width: '600px',
            color: '#0f172a',
            fontFamily: "'Inter', Arial, sans-serif",
            boxSizing: 'border-box',
            position: 'relative'
        }}>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}
            </style>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #312e81, #4f46e5)' }}></div>

            <CommonHeader logoBase64={logoBase64} title="Observer Submission Report" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Assignment ID</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{assignment.id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Generated On</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{todayDate}</div>
                </div>
            </div>

            {/* Section 1: Overview */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#1e293b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    General Information
                </div>
                <div style={{ padding: '16px 20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px 0', color: '#64748b', width: '140px', borderBottom: '1px dashed #e2e8f0' }}>Observer Name</td>
                                <td style={{ padding: '8px 0', color: '#1e1b4b', fontWeight: 700, borderBottom: '1px dashed #e2e8f0', fontSize: '14px' }}>{assignment.teacherName}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0', color: '#64748b', borderBottom: '1px dashed #e2e8f0' }}>From (Home School)</td>
                                <td style={{ padding: '8px 0', color: '#334155', fontWeight: 500, borderBottom: '1px dashed #e2e8f0' }}>{assignment.sourceSchoolName}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0', color: '#64748b', borderBottom: '1px dashed #e2e8f0' }}>Assigned School</td>
                                <td style={{ padding: '8px 0', color: '#4f46e5', fontWeight: 700, borderBottom: '1px dashed #e2e8f0', fontSize: '14px' }}>{assignment.targetSchoolName}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0', color: '#64748b', borderBottom: '1px dashed #e2e8f0' }}>Academic Year</td>
                                <td style={{ padding: '8px 0', color: '#334155', fontWeight: 600, borderBottom: '1px dashed #e2e8f0' }}>{assignment.academicYear}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0', color: '#64748b', borderBottom: '1px dashed #e2e8f0' }}>Submitted At</td>
                                <td style={{ padding: '8px 0', color: '#16a34a', fontWeight: 700, borderBottom: '1px dashed #e2e8f0' }}>{submissionDate}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 2: Attendance Metrics */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#1e293b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Attendance Metrics
                </div>
                <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Total Attendance</span>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#312e81' }}>{assignment.totalAttendance ?? 'N/A'}</span>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '6px' }}>Absentees</div>
                        <div style={{ fontSize: '13px', color: '#1e293b', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', minHeight: '36px', whiteSpace: 'pre-line', fontStyle: assignment.absentees ? 'normal' : 'italic' }}>
                            {assignment.absentees || 'None reported'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Remarks */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#1e293b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Observer Remarks
                </div>
                <div style={{ padding: '20px', backgroundColor: '#faf5ff' }}>
                    <div style={{ fontSize: '13px', color: '#4c1d95', lineHeight: '1.6', whiteSpace: 'pre-line', fontStyle: assignment.remarks ? 'normal' : 'italic' }}>
                        {assignment.remarks ? `"${assignment.remarks}"` : 'No remarks submitted.'}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '50px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        System generated observer report • Eparchy of Kanjirapally
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Director</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Centre for Catechisis</div>
                </div>
            </div>
        </div>
    );
};
