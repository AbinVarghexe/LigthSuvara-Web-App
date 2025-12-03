import {onCall, HttpsError, CallableRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

export interface BulkUserData {
  email: string;
  password: string;
  role: "admin" | "school";
  fullName?: string;
  schoolName?: string;
  phoneNumber?: string;
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
  async (request: CallableRequest<{users: BulkUserData[]}>): Promise<BulkCreateResponse> => {
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
        const userRecord = await admin.auth().createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.fullName,
          phoneNumber: userData.phoneNumber?.startsWith("+") 
            ? userData.phoneNumber 
            : undefined,
        });

        // Create Firestore user profile (WITHOUT password)
        await admin.firestore().collection("users").doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: userData.email,
          role: userData.role,
          fullName: userData.fullName || "",
          schoolName: userData.schoolName || "",
          phoneNumber: userData.phoneNumber || "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: callerUid,
        });

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
