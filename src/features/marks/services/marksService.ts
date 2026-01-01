import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { getQuestions, QuestionData } from '../../questions/services/questionService';

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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MarksData[];
};

// Get marks by animator
export const getMarksByAnimator = async (animatorId: string): Promise<MarksData[]> => {
    const q = query(
        collection(db, 'marks'),
        where('animatorId', '==', animatorId),
        orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MarksData[];
};

// Get marks by school
export const getMarksBySchool = async (schoolId: string): Promise<MarksData[]> => {
    const q = query(
        collection(db, 'marks'),
        where('schoolId', '==', schoolId),
        orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MarksData[];
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
    
    return {
        ...marksData,
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
    const lowerSearch = searchTerm.toLowerCase();
    
    return marks.filter(m => 
        m.parish.toLowerCase().includes(lowerSearch) ||
        m.sundaySchool.toLowerCase().includes(lowerSearch) ||
        m.animatorName.toLowerCase().includes(lowerSearch)
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
