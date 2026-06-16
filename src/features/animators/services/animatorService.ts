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
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { deleteUser, bulkCreateUsers } from '@/features/users/services/userService';

export const getAcademicYear = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const cutOffDate = new Date(year, 4, 15); // May 15 (month index 4 is May)
    return today <= cutOffDate ? (year - 1).toString() : year.toString();
};

export const formatAcademicYear = (yearStr: string): string => {
    const year = parseInt(yearStr);
    if (isNaN(year)) return yearStr;
    const nextYearLastTwo = ((year + 1) % 100).toString().padStart(2, '0');
    return `${year}-${nextYearLastTwo}`;
};

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
    name: string;
    phoneNumber?: string;
    profileImageUrl?: string;
    role: string;
    parish?: string; // Kept for backward compatibility if needed, but pref parishName
    parishId?: string;
    parishName?: string;
    address?: string;
    disabled?: boolean;
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
            name: userData.name || userData.fullName || '',
            phoneNumber: userData.phoneNumber,
            parish: userData.parish,
            parishId: userData.parishId,
            parishName: userData.parishName,
            address: userData.address,
            profileImageUrl: userData.profileImageUrl,
            role: userData.role || 'animator',
            disabled: userData.disabled || false,
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
        name: userData.name || userData.fullName || '',
        phoneNumber: userData.phoneNumber,
        parish: userData.parish,
        parishId: userData.parishId,
        parishName: userData.parishName,
        address: userData.address,
        profileImageUrl: userData.profileImageUrl,
        role: userData.role || 'animator',
        disabled: userData.disabled || false,
        assignments
    };
};

export const createAnimator = async (
    email: string,
    password: string,
    name: string,
    parishId: string,
    parishName: string,
    phoneNumber?: string,
    address?: string
): Promise<string> => {
    // Call bulkCreateUsers Cloud Function to securely create the user with role animator
    const result = await bulkCreateUsers([
        {
            email,
            password,
            name,
            role: 'animator',
            parishId,
            parishName,
            phoneNumber: phoneNumber || '',
            address: address || '',
        } as any
    ]);

    if (!result.success) {
        const errorMsg = result.errors?.[0]?.error || 'Failed to create animator account';
        throw new Error(errorMsg);
    }

    // Query the users collection to get the new user's UID
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    
    if (snap.empty) {
        throw new Error('User document was not found after creation');
    }
    
    const uid = snap.docs[0].id;

    // Create empty animator_assignments document
    await setDoc(doc(db, 'animator_assignments', uid), {
        animatorName: name,
        animatorEmail: email,
        assignments: []
    });

    return uid;
};

export const promoteToAnimator = async (
    userId: string,
    parishId: string,
    parishName: string,
    phoneNumber?: string,
    address?: string
): Promise<void> => {
    // 1. Fetch user doc to get name and email
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const name = userData.name || userData.fullName || '';
    const email = userData.email || '';

    // 2. Update user document to animator role and update other details
    await updateDoc(userDocRef, {
        role: 'animator',
        parishId,
        parishName,
        phoneNumber: phoneNumber || userData.phoneNumber || '',
        address: address || userData.address || '',
        // Make sure name is set since animator role uses 'name'
        name: name,
    });

    // 3. Create animator assignments document if it doesn't exist
    const assignmentDocRef = doc(db, 'animator_assignments', userId);
    const assignmentDoc = await getDoc(assignmentDocRef);
    if (!assignmentDoc.exists()) {
        await setDoc(assignmentDocRef, {
            animatorName: name,
            animatorEmail: email,
            assignments: []
        });
    }
};

export const updateAnimator = async (
    animatorId: string,
    updates: Partial<AnimatorWithUser>
): Promise<void> => {
    // 1. Update user document
    const userUpdateDoc: any = {};
    if (updates.name !== undefined) userUpdateDoc.name = updates.name;
    if (updates.phoneNumber !== undefined) userUpdateDoc.phoneNumber = updates.phoneNumber;
    if (updates.parishId !== undefined) userUpdateDoc.parishId = updates.parishId;
    if (updates.parishName !== undefined) userUpdateDoc.parishName = updates.parishName;
    if (updates.address !== undefined) userUpdateDoc.address = updates.address;

    if (Object.keys(userUpdateDoc).length > 0) {
        await updateDoc(doc(db, 'users', animatorId), userUpdateDoc);
    }

    // 2. Sync animatorName if it changed
    if (updates.name !== undefined) {
        await setDoc(doc(db, 'animator_assignments', animatorId), {
            animatorName: updates.name
        }, { merge: true });
    }
};

// Add assignment to animator (max 7)
export const addAssignment = async (
    animatorId: string,
    assignment: AnimatorAssignment
): Promise<void> => {
    // Check if the school is already assigned to any animator for this specific year
    const allAssignmentsSnapshot = await getDocs(collection(db, 'animator_assignments'));
    const alreadyAssignedThisYear = allAssignmentsSnapshot.docs.some(docSnapshot => {
        const assignments = docSnapshot.data()?.assignments || [];
        return assignments.some((a: AnimatorAssignment) => 
            a.schoolUserId === assignment.schoolUserId && a.year === assignment.year
        );
    });
    if (alreadyAssignedThisYear) {
        throw new Error('This school is already assigned to an animator for this academic year');
    }

    const assignmentDoc = await getDoc(doc(db, 'animator_assignments', animatorId));

    if (assignmentDoc.exists()) {
        const currentAssignments = assignmentDoc.data()?.assignments || [];
        if (currentAssignments.length >= 7) {
            throw new Error('Animator already has maximum 7 assignments');
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
            animatorName: userData.name || userData.fullName || '',
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

// Get schools without animator assignment for a specific year
export const getUnassignedSchools = async (year: string = getAcademicYear()) => {
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
            if (a.year === year) {
                assignedSchoolIds.add(a.schoolUserId);
            }
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
    // Securely delete user from Firebase Auth and Firestore users collection via Cloud Function
    await deleteUser(animatorId);
};

// Get assignment statistics for a specific year
export const getAnimatorStats = async (year: string = getAcademicYear()) => {
    const animators = await getAnimators();
    const assignedInYear = animators.filter(a => a.assignments.some(asg => asg.year === year));
    const unassignedInYear = animators.filter(a => !a.assignments.some(asg => asg.year === year));
    const fullyAssignedInYear = animators.filter(a => a.assignments.filter(asg => asg.year === year).length === 7);
    return {
        total: animators.length,
        assigned: assignedInYear.length,
        unassigned: unassignedInYear.length,
        fullyAssigned: fullyAssignedInYear.length
    };
};
