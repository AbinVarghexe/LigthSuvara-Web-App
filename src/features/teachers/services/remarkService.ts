import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

const OBSERVER_REMARKS_COLLECTION = 'observer_remarks';

export interface ObserverRemark {
  id?: string;
  teacherId: string;
  dutyId: string;
  academicYear: string;
  remark: string;
  createdAt?: Timestamp;
  createdBy: string;
}

export const RemarkService = {
  /**
   * Add a new remark for an observer assignment.
   */
  addRemark: async (remark: Omit<ObserverRemark, 'id' | 'createdAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, OBSERVER_REMARKS_COLLECTION), {
      ...remark,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Get all remarks for a specific observer assignment (dutyId).
   */
  getRemarksByDuty: async (dutyId: string): Promise<ObserverRemark[]> => {
    const q = query(
      collection(db, OBSERVER_REMARKS_COLLECTION),
      where('dutyId', '==', dutyId),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ObserverRemark));
  },

  /**
   * Get all remarks for a specific teacher.
   */
  getRemarksByTeacher: async (teacherId: string): Promise<ObserverRemark[]> => {
    const q = query(
      collection(db, OBSERVER_REMARKS_COLLECTION),
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ObserverRemark));
  },
};
