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
    // Fetch users and assignments in parallel using bulk collection queries (avoids N+1 sequential requests)
    const [usersSnapshot, assignmentsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role', '==', 'animator'))),
        getDocs(collection(db, 'animator_assignments'))
    ]);

    const assignmentsMap = new Map<string, AnimatorAssignment[]>();
    assignmentsSnapshot.docs.forEach(doc => {
        assignmentsMap.set(doc.id, doc.data()?.assignments || []);
    });

    return usersSnapshot.docs.map(userDoc => {
        const userData = userDoc.data();
        const assignments = assignmentsMap.get(userDoc.id) || [];

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
    });
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
    parishId?: string,
    parishName?: string,
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
            parishId: parishId || '',
            parishName: parishName || '',
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
    parishId?: string,
    parishName?: string,
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
        parishId: parishId || '',
        parishName: parishName || '',
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

// Add assignment to animator (max 10 per animator, with school category limits: A:3, B:2, C:1)
export const addAssignment = async (
    animatorId: string,
    assignment: AnimatorAssignment
): Promise<void> => {
    // 1. Fetch animator assignments doc
    const assignmentDoc = await getDoc(doc(db, 'animator_assignments', animatorId));
    const currentAssignments: AnimatorAssignment[] = assignmentDoc.exists()
        ? (assignmentDoc.data()?.assignments || [])
        : [];

    if (currentAssignments.length >= 10) {
        throw new Error('Animator already has maximum 10 assignments');
    }

    // 2. Prevent assigning the SAME school to the SAME animator more than once in the same year
    const alreadyAssignedToThisAnimator = currentAssignments.some((a: AnimatorAssignment) => 
        a.schoolUserId === assignment.schoolUserId && a.year === assignment.year
    );
    if (alreadyAssignedToThisAnimator) {
        throw new Error('This school is already assigned to this animator for this academic year');
    }

    // 3. Fetch school data from users collection to determine category limit
    const schoolDoc = await getDoc(doc(db, 'users', assignment.schoolUserId));
    const schoolData = schoolDoc.exists() ? schoolDoc.data() : null;
    const category: 'A' | 'B' | 'C' = schoolData?.category || 'C';
    const maxAnimators: number = schoolData?.maxAnimators || (category === 'A' ? 3 : category === 'B' ? 2 : 1);

    // 4. Count how many total animators are already assigned to this school for this academic year
    const allAssignmentsSnapshot = await getDocs(collection(db, 'animator_assignments'));
    let currentAssignedCount = 0;
    allAssignmentsSnapshot.docs.forEach(docSnapshot => {
        const assignments = docSnapshot.data()?.assignments || [];
        if (assignments.some((a: AnimatorAssignment) => 
            a.schoolUserId === assignment.schoolUserId && a.year === assignment.year
        )) {
            currentAssignedCount++;
        }
    });

    if (currentAssignedCount >= maxAnimators) {
        throw new Error(
            `This school (Category ${category}) has already reached its maximum limit of ${maxAnimators} animator(s) for academic year ${formatAcademicYear(assignment.year)}`
        );
    }

    if (assignmentDoc.exists()) {
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

// Get schools that still have remaining animator capacity for a specific year
export const getUnassignedSchools = async (year: string = getAcademicYear()) => {
    // Fetch schools and assignments in parallel
    const schoolsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'school')
    );
    const [schoolsSnapshot, assignmentsSnapshot] = await Promise.all([
        getDocs(schoolsQuery),
        getDocs(collection(db, 'animator_assignments'))
    ]);
    const schoolAssignmentCounts = new Map<string, number>();

    assignmentsSnapshot.docs.forEach(doc => {
        const assignments = doc.data()?.assignments || [];
        assignments.forEach((a: AnimatorAssignment) => {
            if (a.year === year) {
                const current = schoolAssignmentCounts.get(a.schoolUserId) || 0;
                schoolAssignmentCounts.set(a.schoolUserId, current + 1);
            }
        });
    });

    // Filter schools that still have available animator capacity (assignedCount < maxAnimators)
    return schoolsSnapshot.docs
        .filter(doc => {
            const data = doc.data();
            const category: 'A' | 'B' | 'C' = data.category || 'C';
            const maxAnimators: number = data.maxAnimators || (category === 'A' ? 3 : category === 'B' ? 2 : 1);
            const currentCount = schoolAssignmentCounts.get(doc.id) || 0;
            return currentCount < maxAnimators;
        })
        .map(doc => {
            const data = doc.data();
            const category: 'A' | 'B' | 'C' = data.category || 'C';
            const maxAnimators: number = data.maxAnimators || (category === 'A' ? 3 : category === 'B' ? 2 : 1);
            const currentCount = schoolAssignmentCounts.get(doc.id) || 0;
            return {
                id: doc.id,
                ...data,
                category,
                maxAnimators,
                assignedCount: currentCount,
                remainingSlots: maxAnimators - currentCount
            };
        });
};

// Delete animator (remove user and assignments)
export const deleteAnimator = async (animatorId: string): Promise<void> => {
    // Delete assignment document
    await deleteDoc(doc(db, 'animator_assignments', animatorId));
    // Securely delete user from Firebase Auth and Firestore users collection via Cloud Function
    await deleteUser(animatorId);
};

// Get assignment statistics for a specific year
export const getAnimatorStats = async (year: string = getAcademicYear(), preloadedAnimators?: AnimatorWithUser[]) => {
    const animators = preloadedAnimators || (await getAnimators());
    const assignedInYear = animators.filter(a => a.assignments.some(asg => asg.year === year));
    const unassignedInYear = animators.filter(a => !a.assignments.some(asg => asg.year === year));
    const fullyAssignedInYear = animators.filter(a => a.assignments.filter(asg => asg.year === year).length >= 10);
    return {
        total: animators.length,
        assigned: assignedInYear.length,
        unassigned: unassignedInYear.length,
        fullyAssigned: fullyAssignedInYear.length
    };
};

export interface BulkAnimatorRow {
    name: string;
    email: string;
    password?: string;
    phoneNumber?: string;
    address?: string;
    parishId?: string;
    parishName?: string;
}

export const bulkCreateAnimators = async (
    animators: BulkAnimatorRow[]
): Promise<{
    success: boolean;
    created: number;
    failed: number;
    errors: { email: string; error: string }[];
}> => {
    if (!animators || animators.length === 0) {
        return { success: true, created: 0, failed: 0, errors: [] };
    }

    const payload = animators.map(a => ({
        name: a.name.trim(),
        email: a.email.trim().toLowerCase(),
        password: a.password || 'Suvara@123',
        role: 'animator' as const,
        parishId: a.parishId || '',
        parishName: a.parishName || '',
        phoneNumber: a.phoneNumber?.trim() || '',
        address: a.address?.trim() || '',
    }));

    // Call bulkCreateUsers Cloud Function through userService
    const result = await bulkCreateUsers(payload as any);

    // Collect all emails that were not in errors
    const errorEmails = new Set((result.errors || []).map(e => (e.email || '').toLowerCase().trim()));
    const createdEmails = payload
        .map(p => p.email)
        .filter(email => !errorEmails.has(email));

    // Initialize animator_assignments for successfully created animators
    if (createdEmails.length > 0) {
        try {
            const usersRef = collection(db, 'users');
            const chunkSize = 30;
            for (let i = 0; i < createdEmails.length; i += chunkSize) {
                const chunk = createdEmails.slice(i, i + chunkSize);
                const q = query(usersRef, where('email', 'in', chunk));
                const snap = await getDocs(q);

                for (const userDoc of snap.docs) {
                    const uData = userDoc.data();
                    const assignmentDocRef = doc(db, 'animator_assignments', userDoc.id);
                    const assignmentDoc = await getDoc(assignmentDocRef);
                    if (!assignmentDoc.exists()) {
                        await setDoc(assignmentDocRef, {
                            animatorName: uData.name || uData.fullName || '',
                            animatorEmail: uData.email || '',
                            assignments: []
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Error creating animator_assignments documents in bulk:', err);
        }
    }

    return result;
};

