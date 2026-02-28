import React from 'react';
import { MarksWithDetails } from '../../features/marks/services/marksService';
import AppLogo from '../../assets/reportlogo.jpg';

const malayalamFont = "'Noto Sans Malayalam', 'NotoSansMalayalam', Arial, sans-serif";

export const MarksPdfTemplate = ({ marksData }: { marksData: MarksWithDetails }) => {
    const parsedYear = parseInt(marksData.year) || new Date().getFullYear();
    const yearRange = `${parsedYear} - ${parsedYear + 1}`;
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' });

    const intToRoman = (num: number): string => {
        const romanMap: [number, string][] = [
            [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
            [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
        ];
        if (num <= 0) return num.toString();
        let result = '';
        for (const [val, sym] of romanMap) {
            let n = num;
            while (n >= val) { result += sym; n -= val; }
            num = n;
        }
        return result;
    };

    let index = 1;
    let currentPart = '';

    // Calculate which parts have at least one answered question
    const activeParts = new Set<string>();
    marksData.questions.forEach(q => {
        const qMarks = marksData.marks[q.id!];
        const subFields = q.subFields || [];
        const answeredSubkeys = subFields.map((_, i) => `${q.id}_sub_${i}`).filter(subKey => {
            const mark = marksData.marks[subKey];
            const text = marksData.textValues?.[subKey]?.trim();
            return (mark !== undefined && mark > 0) || (text !== undefined && text !== '');
        });
        const isAnswered = answeredSubkeys.length > 0 || (qMarks !== undefined && qMarks !== null);

        if (isAnswered && q.part) {
            activeParts.add(q.part);
        }
    });

    return (
        <div id="pdf-template-container" style={{
            background: '#ffffff',
            color: '#000000',
            padding: '40px',
            width: '800px',
            boxSizing: 'border-box',
            fontFamily: malayalamFont,
            fontSize: '15px',
            lineHeight: '1.5',
        }}>
            {/* Google Fonts Import */}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;700&display=swap');`}
            </style>

            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
            }}>
                <div style={{ width: '80px', height: '80px' }}>
                    <img src={AppLogo} style={{ width: '100%', height: 'auto', objectFit: 'contain' }} alt="SUVARA Logo" />
                </div>

                <div style={{ flex: 1, textAlign: 'center', padding: '0 20px' }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '32px',
                        fontWeight: 'bold',
                        letterSpacing: '2px',
                        color: '#000'
                    }}>SUVARA</h1>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>
                        CENTRE FOR CATECHESIS, EPARCHY OF KANJIRAPALLY
                    </div>
                    <div style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        marginTop: '10px',
                        fontFamily: malayalamFont
                    }}>വിശ്വാസജീവിത പരിശീലനം</div>
                    <div style={{ fontSize: '16px', marginTop: '6px', fontFamily: malayalamFont }}>
                        ഇടവകതല വിലയിരുത്തൽ {yearRange}
                    </div>
                </div>

                <div style={{ width: '80px' }} /> {/* Spacer to balance logo */}
            </div>

            {/* Info and Score Row */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px'
            }}>
                <div style={{ flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {[
                                ['Sunday School', marksData.sundaySchool],
                                ['Forane', marksData.forane],
                                ['Animator', marksData.animatorName],
                                ['Date', today],
                            ].map(([label, val]) => (
                                <tr key={label}>
                                    <td style={{ padding: '4px 0', fontWeight: 'bold', width: '120px' }}>{label}:</td>
                                    <td style={{ padding: '4px 0' }}>{val}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{
                    border: '1px solid #000',
                    padding: '10px 20px',
                    textAlign: 'center',
                    minWidth: '140px',
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>
                        Total Score
                    </div>
                    <div style={{ fontSize: '38px', fontWeight: 'bold' }}>
                        {marksData.totalMarks}
                    </div>
                </div>
            </div>

            {/* Marks Table */}
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '10px',
                border: '1.5px solid #000'
            }}>
                <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #000', padding: '10px', width: '50px', fontSize: '14px' }}>No.</th>
                        <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left', fontSize: '15px' }}>Question</th>
                        <th style={{ border: '1px solid #000', padding: '10px', width: '100px', fontSize: '14px' }}>Max Mark</th>
                        <th style={{ border: '1px solid #000', padding: '10px', width: '100px', fontSize: '14px' }}>Mark Awarded</th>
                    </tr>
                </thead>
                <tbody>
                    {marksData.questions.map((question) => {
                        const qPart = question.part || '';
                        const qPartTitle = question.partTitle || '';
                        const isNewPart = qPart !== '' && qPart !== currentPart && activeParts.has(qPart);

                        let partRow = null;
                        if (isNewPart) {
                            currentPart = qPart;
                            index = 1;
                            const parsedPart = parseInt(qPart);
                            const formattedPart = !isNaN(parsedPart) ? intToRoman(parsedPart) : qPart;
                            const displayTitle = qPartTitle ? `${formattedPart}. ${qPartTitle}` : formattedPart;
                            partRow = (
                                <tr key={`part-${qPart}`}>
                                    <td colSpan={4} style={{
                                        border: '1px solid #000',
                                        padding: '10px 12px',
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        backgroundColor: '#f5f5f5',
                                        textAlign: 'left'
                                    }}>
                                        {displayTitle}
                                    </td>
                                </tr>
                            );
                        }

                        const qMarks = marksData.marks[question.id!];
                        const subFields = question.subFields || [];
                        const answeredSubkeys = subFields.map((_, i) => `${question.id}_sub_${i}`).filter(subKey => {
                            const mark = marksData.marks[subKey];
                            const text = marksData.textValues?.[subKey]?.trim();
                            return (mark !== undefined && mark > 0) || (text !== undefined && text !== '');
                        });

                        const isAnswered = answeredSubkeys.length > 0 || (qMarks !== undefined && qMarks !== null);
                        if (!isAnswered && !isNewPart) return null;

                        const questionRows = [];
                        if (isAnswered) {
                            const currentIdx = index++;
                            if (answeredSubkeys.length === 0) {
                                questionRows.push(
                                    <tr key={question.id}>
                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontSize: '14px' }}>{currentIdx}</td>
                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'left', fontSize: '15px' }}>{question.text}</td>
                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontSize: '14px' }}>{question.maxMark || ''}</td>
                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontSize: '14px' }}>{qMarks}</td>
                                    </tr>
                                );
                            } else {
                                let totalQMaxMark = 0;
                                let totalQAwardedMark = 0;
                                subFields.forEach((sf, i) => {
                                    const subKey = `${question.id}_sub_${i}`;
                                    totalQMaxMark += Number(sf.maxMark || 0);
                                    if (marksData.marks[subKey] !== undefined) {
                                        totalQAwardedMark += Number(marksData.marks[subKey] || 0);
                                    }
                                });

                                questionRows.push(
                                    <tr key={question.id}>
                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontSize: '14px' }}>{currentIdx}</td>
                                        <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold', textAlign: 'left', fontSize: '15px' }}>{question.text}</td>
                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>{totalQMaxMark || '-'}</td>
                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>{totalQAwardedMark || '-'}</td>
                                    </tr>
                                );

                                answeredSubkeys.forEach(subKey => {
                                    const subIdx = parseInt(subKey.split('_sub_')[1]);
                                    const sf = subFields[subIdx];
                                    const labelText = marksData.labelsMap?.[subKey] || sf?.text || `Sub ${subIdx + 1}`;
                                    const textVal = marksData.textValues?.[subKey] || '';
                                    const sfMark = marksData.marks[subKey];

                                    questionRows.push(
                                        <tr key={subKey}>
                                            <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '8px 8px 8px 25px', textAlign: 'left' }}>
                                                <div style={{ fontWeight: 'normal', fontSize: '13px' }}>
                                                    <span style={{ color: '#333' }}>{labelText}</span>
                                                    {textVal ? (
                                                        <span style={{ fontStyle: 'italic', color: '#666', marginLeft: '6px' }}>
                                                            — {textVal}
                                                        </span>
                                                    ) : ''}
                                                </div>
                                            </td>
                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '13px' }}>{sf?.maxMark || '0'}</td>
                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '13px' }}>{sfMark ? sfMark : '-'}</td>
                                        </tr>
                                    );
                                });
                            }
                        }

                        return (
                            <React.Fragment key={`frag-${question.id}`}>
                                {partRow}
                                {questionRows}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>

            {/* General Remarks */}
            {marksData.remarks && (
                <div style={{
                    marginTop: '25px',
                    padding: '12px',
                    border: '1px solid #000',
                    backgroundColor: '#fafafa'
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>General Remarks:</div>
                    <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{marksData.remarks}</div>
                </div>
            )}
        </div>
    );
};
