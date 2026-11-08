import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

export interface SubField {
    text: string;
    maxMark: number | null;
    isReadOnly?: boolean;
    adminText?: string;
    adminMark?: number;
}

export interface QuestionData {
    id?: string;
    text: string;
    maxMark: number | null;
    order: number;
    isMandatory?: boolean;
    isReadOnly?: boolean;
    part?: string;
    partTitle?: string;
    subFields?: SubField[];
    createdAt?: Timestamp;
}

// In-memory cache for questions to eliminate redundant round-trips
let questionsCache: QuestionData[] | null = null;

export const clearQuestionsCache = () => {
    questionsCache = null;
};

// Question CRUD Operations
export const getQuestions = async (forceRefresh = false) => {
    if (questionsCache && !forceRefresh) {
        return questionsCache;
    }
    const q = query(collection(db, 'questions'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    questionsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QuestionData[];
    return questionsCache;
};

export const getQuestion = async (questionId: string) => {
    const docRef = doc(db, 'questions', questionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as QuestionData;
    } else {
        throw new Error("No such question!");
    }
};

export const createQuestion = async (questionData: Omit<QuestionData, 'id' | 'createdAt'>) => {
    clearQuestionsCache();
    return await addDoc(collection(db, 'questions'), {
        ...questionData,
        createdAt: serverTimestamp()
    });
};

export const updateQuestion = async (questionId: string, questionData: Partial<QuestionData>) => {
    clearQuestionsCache();
    const docRef = doc(db, 'questions', questionId);
    return await updateDoc(docRef, questionData);
};

export const deleteQuestion = async (questionId: string) => {
    clearQuestionsCache();
    return await deleteDoc(doc(db, 'questions', questionId));
};

export const getNextQuestionOrder = async (): Promise<number> => {
    const questions = await getQuestions();
    if (questions.length === 0) return 1;
    const maxOrder = Math.max(...questions.map(q => q.order));
    return maxOrder + 1;
};

export const reorderQuestions = async (questions: QuestionData[]) => {
    clearQuestionsCache();
    const chunkSize = 400;
    for (let i = 0; i < questions.length; i += chunkSize) {
        const chunk = questions.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((question, index) => {
            const globalIndex = i + index + 1;
            if (question.id) {
                const docRef = doc(db, 'questions', question.id);
                batch.update(docRef, { order: globalIndex, part: question.part || 'I' });
            }
        });
        await batch.commit();
    }
};

export const getTotalMaxMarks = async (): Promise<number> => {
    const questions = await getQuestions();
    return questions.reduce((total, q) => total + (q.maxMark || 0), 0);
};

export const toggleMandatory = async (questionId: string, currentValue: boolean) => {
    clearQuestionsCache();
    const docRef = doc(db, 'questions', questionId);
    return await updateDoc(docRef, { isMandatory: !currentValue });
};
