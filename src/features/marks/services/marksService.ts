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
import { getAnimator, AnimatorWithUser } from '../../animators/services/animatorService';

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
    pdfUrl?: string;
    locked: boolean;
    submittedAt?: Timestamp;
}

export interface MarksWithDetails extends MarksData {
    questions: QuestionData[];
    totalMarks: number;
    maxTotalMarks: number;
    percentage: number;
}

// Map cache for resolving Sunday School names
const schoolNameCache = new Map<string, string>();
const animatorAssignmentCache = new Map<string, string>();

/** Helper to resolve "unknown" Sunday School names efficiently */
export const enrichMarksData = async (marksArray: MarksData[]): Promise<MarksData[]> => {
    const enriched = await Promise.all(
        marksArray.map(async (mark) => {
            let sundaySchool = mark.sundaySchool;
            if (!sundaySchool || sundaySchool.toLowerCase() === 'unknown') {
                if (schoolNameCache.has(mark.schoolId)) {
                    sundaySchool = schoolNameCache.get(mark.schoolId)!;
                } else if (mark.animatorId && animatorAssignmentCache.has(mark.animatorId)) {
                     sundaySchool = animatorAssignmentCache.get(mark.animatorId)!;
                } else if (mark.animatorId) {
                    try {
                        const animator = await getAnimator(mark.animatorId);
                        if (animator && animator.assignments && animator.assignments.length > 0) {
                             // Prefer assignment matching unitId or fallback to the first assignment
                             const assignment = animator.assignments.find(a => a.unitId === mark.unitId) || animator.assignments[0];
                             const resolvedName = assignment.schoolname || assignment.parish || 'Unknown';
                             animatorAssignmentCache.set(mark.animatorId, resolvedName);
                             sundaySchool = resolvedName;
                        } else {
                             // Fallback to getting school user manually as previously implemented
                             const userDoc = await getUser(mark.schoolId);
                             const resolvedName = userDoc.schoolName || userDoc.schoolname || userDoc.fullName || 'Unknown';
                             schoolNameCache.set(mark.schoolId, resolvedName);
                             sundaySchool = resolvedName;
                        }
                    } catch (error) {
                        console.error(`Failed to resolve school name for animator ${mark.animatorId} / school ${mark.schoolId}`, error);
                        schoolNameCache.set(mark.schoolId, 'Unknown');
                        sundaySchool = 'Unknown';
                    }
                } else if (mark.schoolId) {
                    try {
                        const userDoc = await getUser(mark.schoolId);
                        const resolvedName = userDoc.schoolName || userDoc.schoolname || userDoc.fullName || 'Unknown';
                        schoolNameCache.set(mark.schoolId, resolvedName);
                        sundaySchool = resolvedName;
                    } catch (error) {
                        console.error(`Failed to resolve school name for ${mark.schoolId}`, error);
                        schoolNameCache.set(mark.schoolId, 'Unknown');
                        sundaySchool = 'Unknown';
                    }
                }
            }
            return {
                ...mark,
                sundaySchool
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
    const rawMarks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MarksData[];
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
    const rawMarks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MarksData[];
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
    const rawMarks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MarksData[];
    return await enrichMarksData(rawMarks);
};

// Get single marks entry with details
export const getMarksWithDetails = async (marksId: string): Promise<MarksWithDetails | null> => {
    const docRef = doc(db, 'marks', marksId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const marksData = { id: docSnap.id, ...docSnap.data() } as MarksData;
    const questions = await getQuestions();
    
    // Calculate totals
    let totalMarks = 0;
    let maxTotalMarks = 0;
    
    questions.forEach(q => {
        if (q.id && marksData.marks[q.id] !== undefined) {
            totalMarks += marksData.marks[q.id];
        }
        maxTotalMarks += q.maxMarks;
    });
    
    const percentage = maxTotalMarks > 0 ? (totalMarks / maxTotalMarks) * 100 : 0;
    
    const enrichedMarksData = (await enrichMarksData([marksData]))[0];

    return {
        ...enrichedMarksData,
        questions,
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
    const maxTotalMarks = questions.reduce((sum, q) => sum + q.maxMarks, 0);
    
    let totalMarksSum = 0;
    marks.forEach(m => {
        Object.values(m.marks).forEach(mark => {
            totalMarksSum += mark;
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
        
        const marksForQuestion = marks
            .filter(m => m.marks[q.id!] !== undefined)
            .map(m => m.marks[q.id!]);
        
        const average = marksForQuestion.length > 0
            ? marksForQuestion.reduce((sum, m) => sum + m, 0) / marksForQuestion.length
            : 0;
        
        return {
            questionId: q.id,
            questionText: q.text,
            maxMarks: q.maxMarks,
            averageMarks: average,
            submissions: marksForQuestion.length,
            percentage: q.maxMarks > 0 ? (average / q.maxMarks) * 100 : 0
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
