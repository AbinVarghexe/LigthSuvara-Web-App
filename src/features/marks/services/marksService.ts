import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    Timestamp,
    updateDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { getQuestions, QuestionData } from '../../questions/services/questionService';
import { getUser } from '../../users/services/userService';
import { getAnimator } from '../../animators/services/animatorService';

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
}

export interface MarksWithDetails extends MarksData {
    questions: QuestionData[];
    labelsMap: Record<string, string>; // Map of [id]_sub_[index] to label text
    totalMarks: number;
    maxTotalMarks: number;
    percentage: number;
}

// Map cache for resolving Sunday School names
const schoolNameCache = new Map<string, string>();
const foraneNameCache = new Map<string, string>();
// Cache by animatorId + unitId to handle multi-assignment animators
const animatorAssignmentCache = new Map<string, string>();
const animatorForaneCache = new Map<string, string>();

/** Helper to resolve "unknown" Sunday School names efficiently */
export const enrichMarksData = async (marksArray: MarksData[]): Promise<MarksData[]> => {
    const enriched = await Promise.all(
        marksArray.map(async (mark) => {
            let sundaySchool = mark.sundaySchool;
            let forane = mark.forane;
            const sId = mark.schoolId;

            const needsSundaySchool = !sundaySchool || sundaySchool.toLowerCase() === 'unknown';
            const needsForane = !forane;

            if (needsSundaySchool || needsForane) {
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

                            schoolNameCache.set(sId, resolvedName);
                            foraneNameCache.set(sId, resolvedForane);

                            if (needsSundaySchool) sundaySchool = resolvedName;
                            if (needsForane) forane = resolvedForane;
                        }
                    } catch (error) {
                        console.error(`Failed to resolve data for animator ${mark.animatorId} / school ${sId}`, error);
                    }
                } else if (sId) {
                    try {
                        const userDoc = await getUser(sId);
                        const resolvedName = userDoc.schoolName || userDoc.schoolname || userDoc.fullName || 'Unknown';
                        const resolvedForane = userDoc.forane || '';

                        schoolNameCache.set(sId, resolvedName);
                        foraneNameCache.set(sId, resolvedForane);

                        if (needsSundaySchool) sundaySchool = resolvedName;
                        if (needsForane) forane = resolvedForane;
                    } catch (error) {
                        console.error(`Failed to resolve school data for ${sId}`, error);
                    }
                }
            }
            return {
                ...mark,
                sundaySchool,
                forane
            };
        })
    );
    return enriched;
};

// Get all marks
export const getMarks = async (year?: string): Promise<MarksData[]> => {
    let q;
    if (year) {
        q = query(
            collection(db, 'marks'),
            where('year', '==', year),
            orderBy('submittedAt', 'desc')
        );
    } else {
        q = query(collection(db, 'marks'), orderBy('submittedAt', 'desc'));
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
    return await enrichMarksData(rawMarks);
};

// Get marks by animator
export const getMarksByAnimator = async (animatorId: string): Promise<MarksData[]> => {
    const q = query(
        collection(db, 'marks'),
        where('animatorId', '==', animatorId),
        orderBy('submittedAt', 'desc')
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
    return await enrichMarksData(rawMarks);
};

// Get marks by school
export const getMarksBySchool = async (schoolId: string): Promise<MarksData[]> => {
    const q = query(
        collection(db, 'marks'),
        where('schoolId', '==', schoolId),
        orderBy('submittedAt', 'desc')
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
    return await enrichMarksData(rawMarks);
};

// Get single marks entry with details
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
    let totalMarks = 0;
    let maxTotalMarks = 0;

    questions.forEach(q => {
        const subFields = q.subFields || [];
        if (subFields.length > 0) {
            subFields.forEach((sf, i) => {
                const subKey = `${q.id}_sub_${i}`;
                labelsMap[subKey] = sf.text;
                if (marksData.marks[subKey] !== undefined) {
                    totalMarks += (marksData.marks[subKey] || 0);
                }
                maxTotalMarks += (sf.maxMark || 0);
            });
        } else {
            if (q.id && marksData.marks[q.id] !== undefined) {
                totalMarks += (marksData.marks[q.id] || 0);
            }
            maxTotalMarks += (q.maxMark || 0);
        }
    });

    const percentage = maxTotalMarks > 0 ? (totalMarks / maxTotalMarks) * 100 : 0;

    const enrichedMarksData = (await enrichMarksData([marksData]))[0];

    return {
        ...enrichedMarksData,
        questions,
        labelsMap,
        textValues: marksData.textValues || {},
        totalMarks,
        maxTotalMarks,
        percentage
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

// Toggle lock status of marks (admin only)
export const toggleMarksLock = async (marksId: string, currentLocked: boolean): Promise<void> => {
    const docRef = doc(db, 'marks', marksId);
    await updateDoc(docRef, {
        locked: !currentLocked
    });
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
