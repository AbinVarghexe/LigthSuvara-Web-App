import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    Timestamp,
    updateDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { getQuestions, QuestionData } from '../../questions/services/questionService';
import { getUser } from '../../users/services/userService';
import { getAnimator } from '../../animators/services/animatorService';

export interface AnimatorEvaluation {
    marksId: string;
    animatorId: string;
    animatorName: string;
    marks: Record<string, number>;
    remarks?: string;
    questionRemarks?: Record<string, string>;
    textValues?: Record<string, string>;
    pdfUrl?: string;
    locked: boolean;
    submittedAt?: Timestamp;
    totalMarks: number;
    percentage: number;
}

export interface MarksData {
    id?: string;
    unitId: string;
    schoolId: string;
    parish: string;
    sundaySchool: string;
    animatorId: string;
    animatorName: string;
    year: string;
    marks: Record<string, number>; // Map of question ID to marks
    remarks?: string;
    questionRemarks?: Record<string, string>; // Map of question ID to remarks
    textValues?: Record<string, string>; // Map of sub-field ID to text value
    pdfUrl?: string;
    forane?: string;
    locked: boolean;
    submittedAt?: Timestamp;
    category?: 'A' | 'B' | 'C';
    maxAnimators?: number;
    // Multi-animator consolidation metadata
    submissionCount?: number;
    animatorNames?: string[];
    isConsolidated?: boolean;
    allLocked?: boolean;
    peerMarksIds?: string[];
}

export interface MarksWithDetails extends MarksData {
    questions: QuestionData[];
    labelsMap: Record<string, string>; // Map of [id]_sub_[index] to label text
    totalMarks: number;
    maxTotalMarks: number;
    percentage: number;
    evaluations?: AnimatorEvaluation[];
}

// Map cache for resolving Sunday School names
const schoolNameCache = new Map<string, string>();
const foraneNameCache = new Map<string, string>();
const schoolCategoryCache = new Map<string, { category: 'A' | 'B' | 'C'; maxAnimators: number }>();
// Cache by animatorId + unitId to handle multi-assignment animators
const animatorAssignmentCache = new Map<string, string>();
const animatorForaneCache = new Map<string, string>();

/** Helper to resolve "unknown" Sunday School names and category efficiently */
export const enrichMarksData = async (marksArray: MarksData[]): Promise<MarksData[]> => {
    const enriched = await Promise.all(
        marksArray.map(async (mark) => {
            let sundaySchool = mark.sundaySchool;
            let forane = mark.forane;
            let category = mark.category;
            let maxAnimators = mark.maxAnimators;
            const sId = mark.schoolId;

            // Resolve Category from cache or user doc
            if (sId && schoolCategoryCache.has(sId)) {
                const catData = schoolCategoryCache.get(sId)!;
                category = catData.category;
                maxAnimators = catData.maxAnimators;
            }

            const needsSundaySchool = !sundaySchool || sundaySchool.toLowerCase() === 'unknown';
            const needsForane = !forane;
            const needsCategory = !category;

            if (needsSundaySchool || needsForane || needsCategory) {
                const animatorCacheKey = mark.animatorId ? `${mark.animatorId}_${mark.unitId}` : null;

                if (sId && schoolNameCache.has(sId)) {
                    if (needsSundaySchool) sundaySchool = schoolNameCache.get(sId)!;
                    if (needsForane) forane = foraneNameCache.get(sId) || forane;
                } else if (animatorCacheKey && animatorAssignmentCache.has(animatorCacheKey)) {
                    if (needsSundaySchool) sundaySchool = animatorAssignmentCache.get(animatorCacheKey)!;
                    if (needsForane) forane = animatorForaneCache.get(animatorCacheKey) || forane;
                } else if (mark.animatorId) {
                    try {
                        const animator = await getAnimator(mark.animatorId);
                        if (animator && animator.assignments && animator.assignments.length > 0) {
                            const assignment = animator.assignments.find(a => a.unitId === mark.unitId) || animator.assignments[0];
                            const resolvedName = assignment.schoolname || assignment.parish || 'Unknown';
                            const resolvedForane = assignment.forane || '';

                            if (animatorCacheKey) {
                                animatorAssignmentCache.set(animatorCacheKey, resolvedName);
                                animatorForaneCache.set(animatorCacheKey, resolvedForane);
                            }

                            if (needsSundaySchool) sundaySchool = resolvedName;
                            if (needsForane) forane = resolvedForane;
                        } else if (sId) {
                            const userDoc = await getUser(sId);
                            const resolvedName = userDoc.schoolName || userDoc.schoolname || userDoc.fullName || 'Unknown';
                            const resolvedForane = userDoc.forane || '';
                            const resolvedCat = (userDoc.category as 'A' | 'B' | 'C') || 'C';
                            const resolvedMax = userDoc.maxAnimators || (resolvedCat === 'A' ? 3 : resolvedCat === 'B' ? 2 : 1);

                            schoolNameCache.set(sId, resolvedName);
                            foraneNameCache.set(sId, resolvedForane);
                            schoolCategoryCache.set(sId, { category: resolvedCat, maxAnimators: resolvedMax });

                            if (needsSundaySchool) sundaySchool = resolvedName;
                            if (needsForane) forane = resolvedForane;
                            category = resolvedCat;
                            maxAnimators = resolvedMax;
                        }
                    } catch (error) {
                        console.error(`Failed to resolve data for animator ${mark.animatorId} / school ${sId}`, error);
                    }
                } else if (sId) {
                    try {
                        const userDoc = await getUser(sId);
                        const resolvedName = userDoc.schoolName || userDoc.schoolname || userDoc.fullName || 'Unknown';
                        const resolvedForane = userDoc.forane || '';
                        const resolvedCat = (userDoc.category as 'A' | 'B' | 'C') || 'C';
                        const resolvedMax = userDoc.maxAnimators || (resolvedCat === 'A' ? 3 : resolvedCat === 'B' ? 2 : 1);

                        schoolNameCache.set(sId, resolvedName);
                        foraneNameCache.set(sId, resolvedForane);
                        schoolCategoryCache.set(sId, { category: resolvedCat, maxAnimators: resolvedMax });

                        if (needsSundaySchool) sundaySchool = resolvedName;
                        if (needsForane) forane = resolvedForane;
                        category = resolvedCat;
                        maxAnimators = resolvedMax;
                    } catch (error) {
                        console.error(`Failed to resolve school data for ${sId}`, error);
                    }
                }
            }
            return {
                ...mark,
                sundaySchool,
                forane,
                category: category || 'C',
                maxAnimators: maxAnimators || (category === 'A' ? 3 : category === 'B' ? 2 : 1)
            };
        })
    );
    return enriched;
};

/**
 * Consolidates multiple animator evaluations for the same school and year
 * by calculating the arithmetic mean for each question/sub-field.
 */
export const consolidateMarksList = (rawMarks: MarksData[]): MarksData[] => {
    const groups = new Map<string, MarksData[]>();

    rawMarks.forEach(mark => {
        const key = `${mark.schoolId || mark.parish}_${mark.year}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(mark);
    });

    const result: MarksData[] = [];

    groups.forEach((group) => {
        if (group.length === 1) {
            result.push({
                ...group[0],
                submissionCount: 1,
                animatorNames: [group[0].animatorName],
                isConsolidated: false,
                allLocked: group[0].locked,
                peerMarksIds: [group[0].id || '']
            });
            return;
        }

        // Multiple evaluations: compute average for each question
        const base = group[0];
        const allQuestionKeys = new Set<string>();
        group.forEach(g => {
            Object.keys(g.marks || {}).forEach(k => allQuestionKeys.add(k));
        });

        const averagedMarks: Record<string, number> = {};
        allQuestionKeys.forEach(k => {
            let sum = 0;
            let count = 0;
            group.forEach(g => {
                if (typeof g.marks?.[k] === 'number') {
                    sum += g.marks[k];
                    count++;
                }
            });
            averagedMarks[k] = count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
        });

        const animatorNames = group.map(g => g.animatorName || 'Unknown');
        const allLocked = group.every(g => g.locked);
        const combinedRemarks = group
            .map(g => g.remarks ? `${g.animatorName}: ${g.remarks}` : '')
            .filter(Boolean)
            .join(' | ');

        // Latest submission timestamp
        let latestSubmittedAt = group[0].submittedAt;
        group.forEach(g => {
            if (g.submittedAt && (!latestSubmittedAt || (g.submittedAt.seconds > latestSubmittedAt.seconds))) {
                latestSubmittedAt = g.submittedAt;
            }
        });

        result.push({
            ...base,
            id: base.id,
            animatorName: animatorNames.join(', '),
            animatorNames,
            marks: averagedMarks,
            remarks: combinedRemarks || base.remarks,
            locked: allLocked,
            allLocked,
            submittedAt: latestSubmittedAt,
            submissionCount: group.length,
            isConsolidated: true,
            peerMarksIds: group.map(g => g.id || '').filter(Boolean)
        });
    });

    return result;
};

// Get all marks (consolidated by default, raw on demand)
export const getMarks = async (year?: string, raw: boolean = false): Promise<MarksData[]> => {
    let q;
    if (year) {
        q = query(
            collection(db, 'marks'),
            where('year', '==', year)
        );
    } else {
        q = query(collection(db, 'marks'));
    }
    const snapshot = await getDocs(q);
    const rawMarks = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            schoolId: data.schoolUserId || data.schoolId || ''
        } as MarksData;
    });

    // Sort client-side by submittedAt desc
    rawMarks.sort((a, b) => {
        const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate().getTime() : 0;
        const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate().getTime() : 0;
        return dateB - dateA;
    });

    const enriched = await enrichMarksData(rawMarks);
    if (raw) return enriched;
    return consolidateMarksList(enriched);
};

// Get marks by animator
export const getMarksByAnimator = async (animatorId: string): Promise<MarksData[]> => {
    const q = query(
        collection(db, 'marks'),
        where('animatorId', '==', animatorId)
    );
    const snapshot = await getDocs(q);
    const rawMarks = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            schoolId: data.schoolUserId || data.schoolId || ''
        } as MarksData;
    });

    // Sort client-side by submittedAt desc
    rawMarks.sort((a, b) => {
        const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate().getTime() : 0;
        const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate().getTime() : 0;
        return dateB - dateA;
    });

    return await enrichMarksData(rawMarks);
};

// Get marks by school
export const getMarksBySchool = async (schoolId: string): Promise<MarksData[]> => {
    const q = query(
        collection(db, 'marks'),
        where('schoolId', '==', schoolId)
    );
    const snapshot = await getDocs(q);
    const rawMarks = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            schoolId: data.schoolUserId || data.schoolId || ''
        } as MarksData;
    });

    // Sort client-side by submittedAt desc
    rawMarks.sort((a, b) => {
        const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate().getTime() : 0;
        const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate().getTime() : 0;
        return dateB - dateA;
    });

    return await enrichMarksData(rawMarks);
};

// Get single marks entry with details (with multi-animator consolidation)
export const getMarksWithDetails = async (marksId: string): Promise<MarksWithDetails | null> => {
    const docRef = doc(db, 'marks', marksId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    const marksData = {
        id: docSnap.id,
        ...data,
        schoolId: data.schoolUserId || data.schoolId || ''
    } as MarksData;
    const questions = await getQuestions();

    const labelsMap: Record<string, string> = {};
    let maxTotalMarks = 0;

    questions.forEach(q => {
        const subFields = q.subFields || [];
        if (subFields.length > 0) {
            subFields.forEach((sf, i) => {
                const subKey = `${q.id}_sub_${i}`;
                labelsMap[subKey] = sf.text;
                maxTotalMarks += (sf.maxMark || 0);
            });
        } else {
            maxTotalMarks += (q.maxMark || 0);
        }
    });

    // Find all peer submissions for the same school and academic year
    let peerDocs: MarksData[] = [];
    if (marksData.year) {
        const qPeers = query(
            collection(db, 'marks'),
            where('year', '==', marksData.year)
        );
        const peersSnap = await getDocs(qPeers);
        peersSnap.docs.forEach(d => {
            const dData = d.data();
            const dSchoolId = dData.schoolUserId || dData.schoolId || '';
            const matchSchool = marksData.schoolId && dSchoolId === marksData.schoolId;
            const matchParish = marksData.parish && dData.parish && dData.parish.toLowerCase() === marksData.parish.toLowerCase();
            if (matchSchool || matchParish) {
                peerDocs.push({
                    id: d.id,
                    ...dData,
                    schoolId: dSchoolId
                } as MarksData);
            }
        });
    }

    if (peerDocs.length === 0) {
        peerDocs = [marksData];
    }

    // Build individual evaluations for each animator
    const evaluations: AnimatorEvaluation[] = peerDocs.map(pm => {
        let indTotal = 0;
        questions.forEach(q => {
            const subFields = q.subFields || [];
            if (subFields.length > 0) {
                subFields.forEach((_, i) => {
                    const subKey = `${q.id}_sub_${i}`;
                    if (typeof pm.marks?.[subKey] === 'number') {
                        indTotal += pm.marks[subKey];
                    }
                });
            } else if (q.id && typeof pm.marks?.[q.id] === 'number') {
                indTotal += pm.marks[q.id];
            }
        });
        return {
            marksId: pm.id || '',
            animatorId: pm.animatorId,
            animatorName: pm.animatorName || 'Unknown Animator',
            marks: pm.marks || {},
            remarks: pm.remarks,
            questionRemarks: pm.questionRemarks,
            textValues: pm.textValues,
            pdfUrl: pm.pdfUrl,
            locked: pm.locked ?? false,
            submittedAt: pm.submittedAt,
            totalMarks: indTotal,
            percentage: maxTotalMarks > 0 ? Math.round((indTotal / maxTotalMarks) * 1000) / 10 : 0
        };
    });

    const isConsolidated = evaluations.length > 1;
    let finalMarks: Record<string, number> = {};
    let totalMarks = 0;

    if (isConsolidated) {
        // Arithmetic mean across all submitted animators for each question and sub-field
        const allKeys = new Set<string>();
        evaluations.forEach(ev => {
            Object.keys(ev.marks || {}).forEach(k => allKeys.add(k));
        });

        allKeys.forEach(k => {
            let sum = 0;
            let count = 0;
            evaluations.forEach(ev => {
                if (typeof ev.marks?.[k] === 'number') {
                    sum += ev.marks[k];
                    count++;
                }
            });
            finalMarks[k] = count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
        });

        // Sum the averaged question marks
        questions.forEach(q => {
            const subFields = q.subFields || [];
            if (subFields.length > 0) {
                subFields.forEach((_, i) => {
                    const subKey = `${q.id}_sub_${i}`;
                    if (finalMarks[subKey] !== undefined) {
                        totalMarks += finalMarks[subKey];
                    }
                });
            } else if (q.id && finalMarks[q.id] !== undefined) {
                totalMarks += finalMarks[q.id];
            }
        });
        totalMarks = Math.round(totalMarks * 100) / 100;
    } else {
        finalMarks = marksData.marks || {};
        questions.forEach(q => {
            const subFields = q.subFields || [];
            if (subFields.length > 0) {
                subFields.forEach((_, i) => {
                    const subKey = `${q.id}_sub_${i}`;
                    if (finalMarks[subKey] !== undefined) {
                        totalMarks += (finalMarks[subKey] || 0);
                    }
                });
            } else if (q.id && finalMarks[q.id] !== undefined) {
                totalMarks += (finalMarks[q.id] || 0);
            }
        });
    }

    const percentage = maxTotalMarks > 0 ? Math.round((totalMarks / maxTotalMarks) * 1000) / 10 : 0;
    const enrichedMarksData = (await enrichMarksData([marksData]))[0];
    const allLocked = evaluations.every(ev => ev.locked);
    const animatorNamesList = evaluations.map(e => e.animatorName).filter(Boolean);
    const combinedAnimatorName = isConsolidated && animatorNamesList.length > 1
        ? animatorNamesList.join(', ')
        : (enrichedMarksData.animatorName || evaluations[0]?.animatorName || 'Unknown');

    return {
        ...enrichedMarksData,
        animatorName: combinedAnimatorName,
        animatorNames: animatorNamesList.length > 0 ? animatorNamesList : [combinedAnimatorName],
        marks: finalMarks,
        questions,
        labelsMap,
        textValues: marksData.textValues || {},
        totalMarks,
        maxTotalMarks,
        percentage,
        isConsolidated,
        submissionCount: evaluations.length,
        evaluations,
        allLocked,
        peerMarksIds: evaluations.map(e => e.marksId)
    };
};

// Get available years from marks data
export const getAvailableYears = async (): Promise<string[]> => {
    const marks = await getMarks();
    const years = [...new Set(marks.map(m => m.year))];
    return years.sort().reverse();
};

// Get marks statistics
export const getMarksStats = async (year?: string) => {
    const marks = await getMarks(year);
    const questions = await getQuestions();

    let maxTotalMarks = 0;
    questions.forEach(q => {
        const subFields = q.subFields || [];
        if (subFields.length > 0) {
            subFields.forEach(sf => {
                maxTotalMarks += (sf.maxMark || 0);
            });
        } else {
            maxTotalMarks += (q.maxMark || 0);
        }
    });

    let totalMarksSum = 0;
    marks.forEach(m => {
        questions.forEach(q => {
            const subFields = q.subFields || [];
            if (subFields.length > 0) {
                subFields.forEach((_, i) => {
                    const subKey = `${q.id}_sub_${i}`;
                    if (m.marks[subKey] !== undefined) {
                        totalMarksSum += m.marks[subKey];
                    }
                });
            } else if (q.id && m.marks[q.id] !== undefined) {
                totalMarksSum += m.marks[q.id];
            }
        });
    });

    const averageTotal = marks.length > 0 ? totalMarksSum / marks.length : 0;
    const averagePercentage = maxTotalMarks > 0 ? (averageTotal / maxTotalMarks) * 100 : 0;

    return {
        totalSubmissions: marks.length,
        lockedSubmissions: marks.filter(m => m.locked).length,
        unlockedSubmissions: marks.filter(m => !m.locked).length,
        averageMarks: averageTotal,
        averagePercentage,
        maxPossibleMarks: maxTotalMarks
    };
};

// Search marks by parish or school name
export const searchMarks = async (searchTerm: string, year?: string): Promise<MarksData[]> => {
    const marks = await getMarks(year);
    // Since getMarks calls enrichMarksData, marks array already has resolved values.
    const lowerSearch = searchTerm.toLowerCase();

    return marks.filter(m =>
        (m.parish && m.parish.toLowerCase().includes(lowerSearch)) ||
        (m.sundaySchool && m.sundaySchool.toLowerCase().includes(lowerSearch)) ||
        (m.animatorName && m.animatorName.toLowerCase().includes(lowerSearch))
    );
};

// Get question-wise performance stats
export const getQuestionWiseStats = async (year?: string) => {
    const marks = await getMarks(year);
    const questions = await getQuestions();

    const questionStats = questions.map(q => {
        if (!q.id) return null;

        let subFieldCount = (q.subFields || []).length;
        let average = 0;
        let submissions = 0;
        let qMaxMark = q.maxMark || 0;

        if (subFieldCount > 0) {
            let totalSubSum = 0;
            let totalSubMax = 0;

            q.subFields!.forEach((sf, i) => {
                const subKey = `${q.id}_sub_${i}`;
                const marksForSub = marks
                    .filter(m => m.marks[subKey] !== undefined)
                    .map(m => m.marks[subKey]);

                if (marksForSub.length > 0) {
                    totalSubSum += marksForSub.reduce((sum, m) => sum + m, 0) / marksForSub.length;
                    submissions = Math.max(submissions, marksForSub.length);
                }
                totalSubMax += (sf.maxMark || 0);
            });

            average = totalSubSum;
            qMaxMark = totalSubMax;
        } else {
            const marksForQuestion = marks
                .filter(m => m.marks[q.id!] !== undefined)
                .map(m => m.marks[q.id!]);

            average = marksForQuestion.length > 0
                ? marksForQuestion.reduce((sum, m) => sum + m, 0) / marksForQuestion.length
                : 0;
            submissions = marksForQuestion.length;
        }

        return {
            questionId: q.id,
            questionText: q.text,
            maxMarks: qMaxMark,
            averageMarks: average,
            submissions: submissions,
            percentage: qMaxMark > 0 ? (average / qMaxMark) * 100 : 0
        };
    }).filter(Boolean);

    return questionStats;
};

// Toggle lock status of marks (admin only, supports peer multi-animator docs)
export const toggleMarksLock = async (
    marksId: string,
    currentLocked: boolean,
    peerMarksIds?: string[]
): Promise<void> => {
    const ids = peerMarksIds && peerMarksIds.length > 0 ? peerMarksIds : [marksId];
    await Promise.all(
        ids.map(id => updateDoc(doc(db, 'marks', id), { locked: !currentLocked }))
    );
};

// Update remarks of marks (admin only)
export const updateMarksRemark = async (marksId: string, remark: string): Promise<void> => {
    const docRef = doc(db, 'marks', marksId);
    await updateDoc(docRef, {
        remarks: remark
    });
};

// Update question-specific remark (admin only)
export const updateQuestionRemark = async (marksId: string, questionId: string, remark: string): Promise<void> => {
    const docRef = doc(db, 'marks', marksId);

    // First get the current doc to update the nested object
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const currentData = docSnap.data();
    const currentQuestionRemarks = currentData.questionRemarks || {};

    await updateDoc(docRef, {
        questionRemarks: {
            ...currentQuestionRemarks,
            [questionId]: remark
        }
    });
};

// Update question mark (admin only)
export const updateQuestionMark = async (marksId: string, questionId: string, newMark: number): Promise<void> => {
    const docRef = doc(db, 'marks', marksId);

    // First get the current doc to update the nested object
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const currentData = docSnap.data();
    const currentMarks = currentData.marks || {};

    await updateDoc(docRef, {
        marks: {
            ...currentMarks,
            [questionId]: newMark
        }
    });
};

// Update question-specific text value (sub-fields)
export const updateQuestionTextValue = async (marksId: string, subKey: string, text: string): Promise<void> => {
    const docRef = doc(db, 'marks', marksId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const currentData = docSnap.data();
    const currentTextValues = currentData.textValues || {};

    await updateDoc(docRef, {
        textValues: {
            ...currentTextValues,
            [subKey]: text
        }
    });
};

// Get marks by parish
export const getMarksByParish = async (parish: string): Promise<MarksData[]> => {
    const q = query(
        collection(db, 'marks'),
        where('parish', '==', parish)
    );
    const snapshot = await getDocs(q);
    const rawMarks = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            schoolId: data.schoolUserId || data.schoolId || ''
        } as MarksData;
    });

    // Sort by year descending
    rawMarks.sort((a, b) => b.year.localeCompare(a.year));

    return await enrichMarksData(rawMarks);
};

