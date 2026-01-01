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

export interface QuestionData {
    id?: string;
    text: string;
    maxMarks: number;
    order: number;
    createdAt?: Timestamp;
}

// Question CRUD Operations
export const getQuestions = async () => {
    const q = query(collection(db, 'questions'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QuestionData[];
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
    return await addDoc(collection(db, 'questions'), {
        ...questionData,
        createdAt: serverTimestamp()
    });
};

export const updateQuestion = async (questionId: string, questionData: Partial<QuestionData>) => {
    const docRef = doc(db, 'questions', questionId);
    return await updateDoc(docRef, questionData);
};

export const deleteQuestion = async (questionId: string) => {
    return await deleteDoc(doc(db, 'questions', questionId));
};

export const getNextQuestionOrder = async (): Promise<number> => {
    const questions = await getQuestions();
    if (questions.length === 0) return 1;
    const maxOrder = Math.max(...questions.map(q => q.order));
    return maxOrder + 1;
};

export const reorderQuestions = async (questions: QuestionData[]) => {
    const batch = writeBatch(db);
    questions.forEach((question, index) => {
        if (question.id) {
            const docRef = doc(db, 'questions', question.id);
            batch.update(docRef, { order: index + 1 });
        }
    });
    return await batch.commit();
};

export const getTotalMaxMarks = async (): Promise<number> => {
    const questions = await getQuestions();
    return questions.reduce((total, q) => total + q.maxMarks, 0);
};
