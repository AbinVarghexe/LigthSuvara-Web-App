import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

export interface BulkUserData {
  email: string;
  password: string;
  role: "admin" | "school" | "animator" | "parish";
  fullName?: string;
  name?: string;
  schoolname?: string;
  schoolName?: string;
  phoneNumber?: string;
  forane?: string;
  parish?: string;
  address?: string;
  parishId?: string;
  parishName?: string;
  schoolId?: string;
  parishCode?: string;
}

export interface BulkCreateResponse {
  success: boolean;
  created: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

/**
 * Cloud Function to securely create Firebase Auth users and their Firestore profiles.
 * This function uses the Admin SDK to create users with passwords without exposing them
 * in the client-side code or storing them in Firestore.
 * 
 * Call this function from the frontend with an array of user data including passwords.
 */
export const bulkCreateUsers = onCall(
  async (request: CallableRequest<{ users: BulkUserData[] }>): Promise<BulkCreateResponse> => {
    // Verify the caller is authenticated and has admin privileges
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to create users"
      );
    }

    // Check if the caller has admin role
    const callerUid = request.auth.uid;
    const callerDoc = await admin.firestore()
      .collection("users")
      .doc(callerUid)
      .get();

    if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only admins can bulk create users"
      );
    }

    const users: BulkUserData[] = request.data.users;

    if (!Array.isArray(users) || users.length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "Users array is required and must not be empty"
      );
    }

    const results: BulkCreateResponse = {
      success: true,
      created: 0,
      failed: 0,
      errors: [],
    };

    // Process each user
    for (const userData of users) {
      try {
        // Validate required fields
        if (!userData.email || !userData.password || !userData.role) {
          results.failed++;
          results.errors.push({
            email: userData.email || "unknown",
            error: "Missing required fields (email, password, or role)",
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
          results.failed++;
          results.errors.push({
            email: userData.email,
            error: "Invalid email format",
          });
          continue;
        }

        // Check if user with this email already exists in Firestore users collection
        const existingDocs = await admin.firestore()
          .collection("users")
          .where("email", "==", userData.email)
          .limit(1)
          .get();

        if (!existingDocs.empty) {
          results.failed++;
          results.errors.push({
            email: userData.email,
            error: "Email is already in use by another user",
          });
          continue;
        }

        // Validate password strength
        if (userData.password.length < 6) {
          results.failed++;
          results.errors.push({
            email: userData.email,
            error: "Password must be at least 6 characters",
          });
          continue;
        }

        // Create Firebase Auth user
        const authUserOptions: any = {
          email: userData.email,
          password: userData.password,
          displayName: userData.name || userData.fullName || "",
        };
        if (userData.role !== "parish" && userData.phoneNumber?.startsWith("+")) {
          authUserOptions.phoneNumber = userData.phoneNumber;
        }
        const userRecord = await admin.auth().createUser(authUserOptions);

        // Create Firestore user profile (WITHOUT password)
        const userDoc: any = {
          uid: userRecord.uid,
          email: userData.email,
          role: userData.role,
          phoneNumber: userData.role === "parish" ? "" : (userData.phoneNumber || ""),
          profileImageUrl: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: callerUid,
        };

        if (userData.role === "animator") {
          userDoc.name = userData.name || userData.fullName || "";
          userDoc.address = userData.address || "";
          userDoc.parishId = userData.parishId || "";
          userDoc.parishName = userData.parishName || "";
        } else if (userData.role === "parish") {
          userDoc.name = userData.name || userData.fullName || "";
          userDoc.forane = userData.forane || "";
          userDoc.schoolId = userData.schoolId || "";
          userDoc.schoolName = userData.schoolName || userData.schoolname || "";
          userDoc.parishCode = userData.parishCode || "";
          userDoc.status = "online";
          userDoc.parish = userData.parish || "";
        } else {
          userDoc.fullName = userData.fullName || userData.name || "";
          userDoc.schoolname = userData.schoolname || userData.schoolName || "";
          userDoc.forane = userData.forane || "";
          userDoc.parish = userData.parish || "";
          userDoc.parishCode = userData.parishCode || "";
        }

        await admin.firestore().collection("users").doc(userRecord.uid).set(userDoc);

        results.created++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          email: userData.email,
          error: error.message || "Unknown error occurred",
        });

        // Log the error for debugging
        console.error(`Failed to create user ${userData.email}:`, error);
      }
    }

    // Mark as not fully successful if any failures occurred
    if (results.failed > 0) {
      results.success = false;
    }

    return results;
  }
);

/**
 * Cloud Function to securely delete a user from both Firebase Auth and Firestore.
 * Only admins can perform this action.
 */
export const deleteUser = onCall(
  async (request: CallableRequest<{ uid: string }>): Promise<{ success: boolean }> => {
    // Verify the caller is authenticated
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to delete users"
      );
    }

    // Check if the caller has admin role
    const callerUid = request.auth.uid;
    const callerDoc = await admin.firestore()
      .collection("users")
      .doc(callerUid)
      .get();

    if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only admins can delete users"
      );
    }

    const uidToDelete = request.data.uid;
    if (!uidToDelete) {
      throw new HttpsError(
        "invalid-argument",
        "UID to delete is required"
      );
    }

    // Prevent self-deletion via this function for safety
    if (uidToDelete === callerUid) {
      throw new HttpsError(
        "permission-denied",
        "Admins cannot delete their own account via this function"
      );
    }

    try {
      // 1. Delete from Firebase Auth
      try {
        await admin.auth().deleteUser(uidToDelete);
      } catch (authError: any) {
        // If user not found in Auth, we should still try to delete from Firestore
        if (authError.code !== 'auth/user-not-found') {
          throw authError;
        }
      }

      // 2. Delete from Firestore
      await admin.firestore().collection("users").doc(uidToDelete).delete();

      return { success: true };
    } catch (error: any) {
      console.error(`Failed to delete user ${uidToDelete}:`, error);
      throw new HttpsError("internal", error.message || "Failed to delete user");
    }
  }
);
