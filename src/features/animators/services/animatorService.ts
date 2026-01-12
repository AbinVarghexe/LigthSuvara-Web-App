import {
    collection,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    Timestamp,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../config/firebase';

export interface AnimatorAssignment {
    unitId: string;
    schoolUserId: string;
    schoolname: string;
    parish: string;
    forane: string;
    year: string;
}

export interface AnimatorAssignmentData {
    id?: string; // Document ID = animator UID
    animatorName: string;
    animatorEmail: string;
    assignments: AnimatorAssignment[];
}

export interface AnimatorWithUser {
    id: string;
    uid: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    profileImageUrl?: string;
    parish?: string;
    address?: string;
    assignments: AnimatorAssignment[];
}

// Get all animators with their assignments
export const getAnimators = async (): Promise<AnimatorWithUser[]> => {
    // Get all users with role 'animator'
    const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'animator')
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    const animators: AnimatorWithUser[] = [];
    
    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Get animator assignments
        const assignmentDoc = await getDoc(doc(db, 'animator_assignments', userDoc.id));
        const assignments = assignmentDoc.exists() 
            ? (assignmentDoc.data()?.assignments || []) 
            : [];
        
        animators.push({
            id: userDoc.id,
            uid: userDoc.id,
            email: userData.email || '',
            fullName: userData.fullName || userData.name || '',
            phoneNumber: userData.phoneNumber,
            parish: userData.parish,
            address: userData.address,
            profileImageUrl: userData.profileImageUrl,
            assignments
        });
    }
    
    return animators;
};

// Get single animator with assignments
export const getAnimator = async (animatorId: string): Promise<AnimatorWithUser | null> => {
    const userDoc = await getDoc(doc(db, 'users', animatorId));
    if (!userDoc.exists() || userDoc.data()?.role !== 'animator') {
        return null;
    }
    
    const userData = userDoc.data();
    const assignmentDoc = await getDoc(doc(db, 'animator_assignments', animatorId));
    const assignments = assignmentDoc.exists() 
        ? (assignmentDoc.data()?.assignments || []) 
        : [];
    
    return {
        id: userDoc.id,
        uid: userDoc.id,
        email: userData.email || '',
        fullName: userData.fullName || userData.name || '',
        phoneNumber: userData.phoneNumber,
        parish: userData.parish,
        address: userData.address,
        profileImageUrl: userData.profileImageUrl,
        assignments
    };
};

// Create animator account
export const createAnimator = async (
    email: string,
    password: string,
    fullName: string,
    phoneNumber?: string,
    parish?: string,
    address?: string
): Promise<string> => {
    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Create user document with animator role
    await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        fullName,
        role: 'animator',
        phoneNumber: phoneNumber || '',
        parish: parish || '',
        address: address || '',
        createdAt: Timestamp.now()
    });
    
    // Create empty animator_assignments document
    await setDoc(doc(db, 'animator_assignments', uid), {
        animatorName: fullName,
        animatorEmail: email,
        assignments: []
    });
    
    return uid;
};

// Add assignment to animator (max 2)
export const addAssignment = async (
    animatorId: string,
    assignment: AnimatorAssignment
): Promise<void> => {
    const assignmentDoc = await getDoc(doc(db, 'animator_assignments', animatorId));
    
    if (assignmentDoc.exists()) {
        const currentAssignments = assignmentDoc.data()?.assignments || [];
        if (currentAssignments.length >= 2) {
            throw new Error('Animator already has maximum 2 assignments');
        }
        
        // Check if school is already assigned to this animator
        const schoolAlreadyAssigned = currentAssignments.some(
            (a: AnimatorAssignment) => a.schoolUserId === assignment.schoolUserId
        );
        if (schoolAlreadyAssigned) {
            throw new Error('This school is already assigned to this animator');
        }
        
        await updateDoc(doc(db, 'animator_assignments', animatorId), {
            assignments: arrayUnion(assignment)
        });
    } else {
        // Create new assignment document
        const userDoc = await getDoc(doc(db, 'users', animatorId));
        if (!userDoc.exists()) throw new Error('Animator not found');
        
        const userData = userDoc.data();
        await setDoc(doc(db, 'animator_assignments', animatorId), {
            animatorName: userData.fullName || '',
            animatorEmail: userData.email || '',
            assignments: [assignment]
        });
    }
};

// Remove assignment from animator
export const removeAssignment = async (
    animatorId: string,
    assignment: AnimatorAssignment
): Promise<void> => {
    await updateDoc(doc(db, 'animator_assignments', animatorId), {
        assignments: arrayRemove(assignment)
    });
};

// Get schools without animator assignment
export const getUnassignedSchools = async () => {
    // Get all schools
    const schoolsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'school')
    );
    const schoolsSnapshot = await getDocs(schoolsQuery);
    
    // Get all assignments
    const assignmentsSnapshot = await getDocs(collection(db, 'animator_assignments'));
    const assignedSchoolIds = new Set<string>();
    
    assignmentsSnapshot.docs.forEach(doc => {
        const assignments = doc.data()?.assignments || [];
        assignments.forEach((a: AnimatorAssignment) => {
            assignedSchoolIds.add(a.schoolUserId);
        });
    });
    
    // Filter schools without assignments
    return schoolsSnapshot.docs
        .filter(doc => !assignedSchoolIds.has(doc.id))
        .map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
};

// Delete animator (remove user and assignments)
export const deleteAnimator = async (animatorId: string): Promise<void> => {
    // Delete assignment document
    await deleteDoc(doc(db, 'animator_assignments', animatorId));
    // Note: Firebase Auth user deletion requires Admin SDK or Cloud Functions
    // Only delete Firestore user document here
    await deleteDoc(doc(db, 'users', animatorId));
};

// Get assignment statistics
export const getAnimatorStats = async () => {
    const animators = await getAnimators();
    return {
        total: animators.length,
        assigned: animators.filter(a => a.assignments.length > 0).length,
        unassigned: animators.filter(a => a.assignments.length === 0).length,
        fullyAssigned: animators.filter(a => a.assignments.length === 2).length
    };
};
