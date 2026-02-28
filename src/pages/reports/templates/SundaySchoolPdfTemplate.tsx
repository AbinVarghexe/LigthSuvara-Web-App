import React from 'react';
import { UserData } from '../../../features/users/services/userService';

interface SundaySchoolPdfTemplateProps {
    users: UserData[];
    forane: string;
    parish: string;
}

export const SundaySchoolPdfTemplate = ({ users, forane, parish }: SundaySchoolPdfTemplateProps) => {
    const todayDate = new Date().toISOString().split('T')[0];

    // Grouping logic
    const groupedUsers = users.reduce((acc, user) => {
        const f = user.forane || 'Unknown Forane';
        if (!acc[f]) acc[f] = [];
        acc[f].push(user);
        return acc;
    }, {} as Record<string, UserData[]>);

    const sortedForanes = Object.keys(groupedUsers).sort();

    return (
        <div id="ss-pdf-container" style={{
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
                        Sunday School Registry
                    </h1>
                    <div style={{ fontSize: '18px', color: '#64748b', fontWeight: 500, borderLeft: '3px solid #cbd5e1', paddingLeft: '12px', marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        <span><strong style={{ color: '#334155' }}>Forane:</strong> {forane || 'All'}</span>
                        <span><strong style={{ color: '#334155' }}>Parish:</strong> {parish || 'All'}</span>
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
                            <th style={{ padding: '16px', width: '40%' }}>Parish / School Name</th>
                            <th style={{ padding: '16px', width: '35%' }}>TechSupporter</th>
                            <th style={{ padding: '16px', width: '120px' }}>Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                    No Sunday School records found matching these criteria.
                                </td>
                            </tr>
                        ) : (
                            sortedForanes.map((fName) => (
                                <React.Fragment key={fName}>
                                    {/* Forane Header Row */}
                                    <tr style={{ backgroundColor: '#eff6ff', borderBottom: '2px solid #bfdbfe' }}>
                                        <td colSpan={4} style={{ padding: '12px 16px', color: '#1e40af', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {fName}
                                        </td>
                                    </tr>
                                    {/* Forane Users list */}
                                    {groupedUsers[fName].map((user, i) => (
                                        <tr key={user.id || i} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                            <td style={{ padding: '14px 16px', color: '#64748b', textAlign: 'center', fontWeight: 500 }}>{i + 1}</td>
                                            <td style={{ padding: '14px 16px', color: '#0f172a', fontWeight: 600 }}>{user.schoolName || user.schoolname || 'N/A'}</td>
                                            <td style={{ padding: '14px 16px', color: '#334155' }}>{user.fullName || 'Unknown'}</td>
                                            <td style={{ padding: '14px 16px', color: '#475569', fontFamily: 'monospace', fontSize: '13px' }}>{user.phoneNumber || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ width: '680px', boxSizing: 'border-box', marginTop: '60px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                <div style={{ textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>SUVARA • Official Administrative System</div>
                <div>{new Date().getFullYear()} © Eparchy of Kanjirapally</div>
            </div>
        </div>
    );
};
