import React from 'react';
import { Teacher } from '../../../features/teachers/types';
import { UserData } from '../../../features/users/services/userService';

// Helper to get school metadata from the user list
const getParishInfo = (schoolId: string, users: UserData[]) => {
    const schoolUser = users.find(u => (u.uid === schoolId || u.id === schoolId) && u.role === "school");
    if (!schoolUser) return { forane: 'Other', name: 'Other' };

    // Some school users might have forane in their name if not explicitly set
    let forane = schoolUser.forane || 'Other';
    const name = schoolUser.schoolName || schoolUser.schoolname || 'Other';

    if (forane === 'Other' && name.includes('-')) {
        forane = name.split('-')[0].trim();
    }

    return { forane, name };
};

/* -------------------------------------------------------------------------- */
/*                        OBSERVER DIRECTORY TEMPLATE                         */
/* -------------------------------------------------------------------------- */
interface ObserverDirPdfTemplateProps {
    observers: Teacher[];
    users: UserData[]; // used to look up home parish info securely
    foraneFilter: string;
    parishFilter: string;
    academicYear: string;
}

export const ObserverDirPdfTemplate = ({
    observers, users, foraneFilter, parishFilter, academicYear
}: ObserverDirPdfTemplateProps) => {
    const todayDate = new Date().toISOString().split('T')[0];

    // Group by Home Forane -> Home Parish
    const grouped = observers.reduce((acc, obs) => {
        const { forane: lookupForane, name: lookupName } = getParishInfo(obs.parishId || obs.schoolId || '', users);

        const parishName = obs.parishName || (obs as any).schoolName || lookupName;
        const foraneName = lookupForane === 'Other' && parishName.includes('-') ? parishName.split('-')[0].trim() : lookupForane;

        if (!acc[foraneName]) acc[foraneName] = {};
        if (!acc[foraneName][parishName]) acc[foraneName][parishName] = [];

        acc[foraneName][parishName].push(obs);
        return acc;
    }, {} as Record<string, Record<string, Teacher[]>>);

    const sortedForanes = Object.keys(grouped).sort();

    return (
        <div id="observer-dir-pdf-container" style={{
            padding: '50px 60px', backgroundColor: '#ffffff', width: '800px', minHeight: '1000px',
            color: '#0f172a', fontFamily: "'Inter', Arial, sans-serif", boxSizing: 'border-box',
            position: 'relative', transform: 'scale(0.93)', transformOrigin: 'top left'
        }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Malayalam:wght@400;700&display=swap');`}</style>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', backgroundColor: '#2563eb' }}></div>

            <div style={{ marginBottom: '36px', width: '680px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px' }}>
                    Official Document
                </div>
                <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.8px', lineHeight: '1.2' }}>
                    Observer Directory
                </h1>
                <div style={{ fontSize: '18px', color: '#64748b', fontWeight: 500, paddingLeft: '12px', borderLeft: '3px solid #cbd5e1', marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <span><strong style={{ color: '#334155' }}>Year:</strong> {academicYear || 'All'}</span>
                    <span><strong style={{ color: '#334155' }}>Forane:</strong> {foraneFilter || 'All'}</span>
                    <span><strong style={{ color: '#334155' }}>Parish:</strong> {parishFilter || 'All'}</span>
                    <span><strong style={{ color: '#334155' }}>Date:</strong> {todayDate}</span>
                </div>
            </div>

            <div style={{ width: '680px', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                            <th style={{ padding: '16px', width: '40px', textAlign: 'center' }}>#</th>
                            <th style={{ padding: '16px', width: '35%' }}>Observer Name</th>
                            <th style={{ padding: '16px', width: '30%' }}>Phone</th>
                            <th style={{ padding: '16px' }}>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {observers.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No records found.</td></tr>
                        ) : (
                            sortedForanes.map((fName) => {
                                const parishesInForane = Object.keys(grouped[fName]).sort();
                                return (
                                    <React.Fragment key={fName}>
                                        <tr style={{ backgroundColor: '#eff6ff', borderBottom: '2px solid #bfdbfe' }}>
                                            <td colSpan={4} style={{ padding: '14px 16px', color: '#1e40af', fontWeight: 800, fontSize: '15px', textTransform: 'uppercase' }}>
                                                {fName === 'Other' ? 'Other / Unassigned Records' : `${fName} Forane`}
                                            </td>
                                        </tr>
                                        {parishesInForane.map((pName) => (
                                            <React.Fragment key={pName}>
                                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                    <td colSpan={4} style={{ padding: '10px 16px', color: '#475569', fontWeight: 600, fontSize: '13px', paddingLeft: '32px' }}>
                                                        <span style={{ color: '#94a3b8', marginRight: '8px' }}>↳</span>Parish: <span style={{ color: '#0f172a' }}>{pName}</span>
                                                    </td>
                                                </tr>
                                                {grouped[fName][pName].map((obs, i) => (
                                                    <tr key={obs.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '12px 16px', color: '#64748b', textAlign: 'center', fontSize: '13px' }}>{i + 1}</td>
                                                        <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600 }}>{obs.name}</td>
                                                        <td style={{ padding: '12px 16px', color: '#475569', fontFamily: 'monospace', fontSize: '13px' }}>{obs.phone || '-'}</td>
                                                        <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>{obs.email || '-'}</td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ width: '680px', marginTop: '60px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                <div>SUVARA • Official Administrative System</div>
                <div>{new Date().getFullYear()} © Eparchy of Kanjirapally</div>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                       OBSERVER ASSIGNMENTS TEMPLATE                        */
/* -------------------------------------------------------------------------- */
interface ObserverAssignPdfTemplateProps {
    assignments: any[];
    teachers: Teacher[];
    users: UserData[];
    foraneFilter: string;
    parishFilter: string;
    academicYear: string;
}

export const ObserverAssignPdfTemplate = ({
    assignments, teachers, users, foraneFilter, parishFilter, academicYear
}: ObserverAssignPdfTemplateProps) => {
    const todayDate = new Date().toISOString().split('T')[0];

    // Group by Home Forane -> Home Parish
    const grouped = assignments.reduce((acc, a) => {
        const t = teachers.find(teach => teach.id === a.teacherId);

        // Try all possible source IDs
        const sourceId = a.sourceSchoolId || t?.parishId || (t as any)?.schoolId || '';
        const { forane: lookupForane, name: lookupName } = getParishInfo(sourceId, users);

        const parishName = a.sourceSchoolName || t?.parishName || (t as any)?.schoolName || lookupName;
        // If forane is still other, try to extract it from any available name
        const foraneName = lookupForane === 'Other'
            ? (parishName.includes('-') ? parishName.split('-')[0].trim() : lookupForane)
            : lookupForane;

        if (!acc[foraneName]) acc[foraneName] = {};
        if (!acc[foraneName][parishName]) acc[foraneName][parishName] = [];

        acc[foraneName][parishName].push(a);
        return acc;
    }, {} as Record<string, Record<string, any[]>>);

    const sortedForanes = Object.keys(grouped).sort();

    return (
        <div id="observer-assign-pdf-container" style={{
            padding: '50px 60px', backgroundColor: '#ffffff', width: '800px', minHeight: '1000px',
            color: '#0f172a', fontFamily: "'Inter', Arial, sans-serif", boxSizing: 'border-box',
            position: 'relative', transform: 'scale(0.93)', transformOrigin: 'top left'
        }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Malayalam:wght@400;700&display=swap');`}</style>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', backgroundColor: '#2563eb' }}></div>

            <div style={{ marginBottom: '36px', width: '680px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px' }}>
                    Official Document
                </div>
                <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.8px', lineHeight: '1.2' }}>
                    Duty Assignments
                </h1>
                <div style={{ fontSize: '18px', color: '#64748b', fontWeight: 500, paddingLeft: '12px', borderLeft: '3px solid #cbd5e1', marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <span><strong style={{ color: '#334155' }}>Year:</strong> {academicYear || 'All'}</span>
                    <span><strong style={{ color: '#334155' }}>Forane:</strong> {foraneFilter || 'All'}</span>
                    <span><strong style={{ color: '#334155' }}>Parish:</strong> {parishFilter || 'All'}</span>
                    <span><strong style={{ color: '#334155' }}>Date:</strong> {todayDate}</span>
                </div>
            </div>

            <div style={{ width: '680px', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                            <th style={{ padding: '16px', width: '40px', textAlign: 'center' }}>#</th>
                            <th style={{ padding: '16px', width: '30%' }}>Observer Name</th>
                            <th style={{ padding: '16px', width: '30%' }}>Assigned To</th>
                            <th style={{ padding: '16px', width: '15%' }}>Class</th>
                            <th style={{ padding: '16px', width: '20%' }}>Phone</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No records found.</td></tr>
                        ) : (
                            sortedForanes.map((fName) => {
                                const parishesInForane = Object.keys(grouped[fName]).sort();
                                return (
                                    <React.Fragment key={fName}>
                                        <tr style={{ backgroundColor: '#eff6ff', borderBottom: '2px solid #bfdbfe' }}>
                                            <td colSpan={5} style={{ padding: '14px 16px', color: '#1e40af', fontWeight: 800, fontSize: '15px', textTransform: 'uppercase' }}>
                                                {fName === 'Other' ? 'Other / Unassigned Records' : `${fName} Forane`}
                                            </td>
                                        </tr>
                                        {parishesInForane.map((pName) => (
                                            <React.Fragment key={pName}>
                                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                    <td colSpan={5} style={{ padding: '10px 16px', color: '#475569', fontWeight: 600, fontSize: '13px', paddingLeft: '32px' }}>
                                                        <span style={{ color: '#94a3b8', marginRight: '8px' }}>↳</span>Home Parish: <span style={{ color: '#0f172a' }}>{pName}</span>
                                                    </td>
                                                </tr>
                                                {grouped[fName][pName].map((assign: any, i: number) => {
                                                    const t = teachers.find(teach => teach.id === assign.teacherId);
                                                    const assignedParishInfo = getParishInfo(assign.targetSchoolId || '', users);
                                                    const assignedName = assign.targetSchoolName && assign.targetSchoolName.trim() !== '' ? assign.targetSchoolName : assignedParishInfo.name;
                                                    return (
                                                        <tr key={assign.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '12px 16px', color: '#64748b', textAlign: 'center', fontSize: '13px' }}>{i + 1}</td>
                                                            <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600 }}>{t?.name || 'Unknown User'}</td>
                                                            <td style={{ padding: '12px 16px', color: '#0f172a', fontSize: '13px' }}>{assignedName}</td>
                                                            <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>
                                                                {t ? (Array.isArray(t.classes) ? (t.classes.length > 0 ? t.classes.join(', ') : '-') : (t.classes || '-')) : '-'}
                                                            </td>
                                                            <td style={{ padding: '12px 16px', color: '#475569', fontFamily: 'monospace', fontSize: '13px' }}>{t?.phone || '-'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ width: '680px', marginTop: '60px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                <div>SUVARA • Official Administrative System</div>
                <div>{new Date().getFullYear()} © Eparchy of Kanjirapally</div>
            </div>
        </div>
    );
};
