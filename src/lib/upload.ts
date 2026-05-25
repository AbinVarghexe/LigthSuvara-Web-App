import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/config/firebase";
import { compressImage } from "./imageCompression";

export const uploadFile = async (file: File, path: string): Promise<string> => {
  if (!file) {
    throw new Error("No file provided");
  }

  let fileToUpload: File | Blob = file;
  let finalPath = path;

  if (file.type.startsWith("image/") && file.type !== "image/gif") {
    fileToUpload = await compressImage(file);
    if (fileToUpload instanceof File && fileToUpload.name.endsWith(".jpg")) {
      const lastDot = path.lastIndexOf(".");
      if (lastDot !== -1) {
        finalPath = path.substring(0, lastDot) + ".jpg";
      } else {
        finalPath = path + ".jpg";
      }
    }
  }

  const storageRef = ref(storage, finalPath);
  const snapshot = await uploadBytes(storageRef, fileToUpload);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
};
