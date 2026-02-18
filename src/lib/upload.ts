import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/config/firebase";

export const uploadFile = async (file: File, path: string): Promise<string> => {
  if (!file) {
    throw new Error("No file provided");
  }

  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
};
