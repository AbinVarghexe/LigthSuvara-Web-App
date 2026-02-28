import React from 'react';
import { Teacher, Parish } from '../../../features/teachers/types';

interface TeacherClassPdfTemplateProps {
    teachers: Teacher[];
    parishes: Parish[];
    academicYear: string;
    classFilter: string;
    foraneFilter: string;
    parishFilter: string;
}

export const TeacherClassPdfTemplate = ({
    teachers, parishes, academicYear, classFilter, foraneFilter, parishFilter
}: TeacherClassPdfTemplateProps) => {
    const todayDate = new Date().toISOString().split('T')[0];

    // Group teachers by Forane -> Parish
    const grouped = teachers.reduce((acc, t) => {
        let foraneName = 'Unassigned';
        let parishName = 'Unassigned';

        if (t.parishId) {
            const p = parishes.find(p => p.id === t.parishId);
            if (p) {
                foraneName = p.forane || 'Unknown Forane';
                parishName = p.name || 'Unknown Parish';
            }
        }

        if (!acc[foraneName]) acc[foraneName] = {};
        if (!acc[foraneName][parishName]) acc[foraneName][parishName] = [];

        acc[foraneName][parishName].push(t);
        return acc;
    }, {} as Record<string, Record<string, Teacher[]>>);

    const sortedForanes = Object.keys(grouped).sort();

    return (
        <div id="teacher-pdf-container" style={{
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

            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', backgroundColor: '#2563eb' }}></div>

            {/* Header Area */}
            <div style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '680px', boxSizing: 'border-box' }}>
                <div style={{ width: '100%' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px' }}>
                        Official Document
                    </div>
                    <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.8px', lineHeight: '1.2' }}>
                        Teachers Registry
                    </h1>
                    <div style={{ fontSize: '18px', color: '#64748b', fontWeight: 500, paddingLeft: '12px', borderLeft: '3px solid #cbd5e1', marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        <span><strong style={{ color: '#334155' }}>Year:</strong> {academicYear || 'All'}</span>
                        <span><strong style={{ color: '#334155' }}>Class:</strong> {classFilter || 'All'}</span>
                        <span><strong style={{ color: '#334155' }}>Forane:</strong> {foraneFilter || 'All'}</span>
                        <span><strong style={{ color: '#334155' }}>Parish:</strong> {parishFilter || 'All'}</span>
                        <span><strong style={{ color: '#334155' }}>Date:</strong> {todayDate}</span>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div style={{ width: '680px', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', fontFamily: "'Noto Sans Malayalam', 'Inter', sans-serif" }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '16px', width: '40px', textAlign: 'center' }}>#</th>
                            <th style={{ padding: '16px', width: '35%' }}>Teacher Name</th>
                            <th style={{ padding: '16px', width: '25%' }}>Qualifications</th>
                            <th style={{ padding: '16px' }}>Classes</th>
                            <th style={{ padding: '16px', width: '120px' }}>Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teachers.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                    No records found matching these criteria.
                                </td>
                            </tr>
                        ) : (
                            sortedForanes.map((fName) => {
                                const parishesInForane = Object.keys(grouped[fName]).sort();

                                return (
                                    <React.Fragment key={fName}>
                                        {/* Forane Header Row */}
                                        <tr style={{ backgroundColor: '#eff6ff', borderBottom: '2px solid #bfdbfe' }}>
                                            <td colSpan={5} style={{ padding: '14px 16px', color: '#1e40af', fontWeight: 800, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {fName} Forane
                                            </td>
                                        </tr>

                                        {parishesInForane.map((pName) => (
                                            <React.Fragment key={pName}>
                                                {/* Parish Subheader Row */}
                                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                    <td colSpan={5} style={{ padding: '10px 16px', color: '#475569', fontWeight: 600, fontSize: '13px', paddingLeft: '32px' }}>
                                                        <span style={{ display: 'inline-block', marginRight: '8px', color: '#94a3b8' }}>↳</span>
                                                        Parish: <span style={{ color: '#0f172a' }}>{pName}</span>
                                                    </td>
                                                </tr>

                                                {/* Teacher Rows */}
                                                {grouped[fName][pName].map((t, i) => (
                                                    <tr key={t.id || i} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                                                        <td style={{ padding: '12px 16px', color: '#64748b', textAlign: 'center', fontSize: '13px' }}>{i + 1}</td>
                                                        <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600 }}>{t.name || 'Unknown'}</td>
                                                        <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>{t.qualification || '-'}</td>
                                                        <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>
                                                            {Array.isArray(t.classes) ? (t.classes.length > 0 ? t.classes.join(', ') : '-') : (t.classes || '-')}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', color: '#475569', fontFamily: 'monospace', fontSize: '13px' }}>{t.phone || '-'}</td>
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

            <div style={{ width: '680px', boxSizing: 'border-box', marginTop: '60px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                <div style={{ textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>SUVARA • Official Administrative System</div>
                <div>{new Date().getFullYear()} © Eparchy of Kanjirapally</div>
            </div>
        </div>
    );
};
