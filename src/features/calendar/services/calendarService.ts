import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";

export interface CalendarConfig {
  pdfUrl: string;
  buttonTitle: string;
  calendarUrl?: string;
  url?: string;
  title?: string;
  buttonText?: string;
  updatedAt?: string;
}

const SETTINGS_COLLECTION = "settings";

export const getCalendarConfig = async (): Promise<CalendarConfig> => {
  // Try loading from "settings/calendar"
  const docRef = doc(db, SETTINGS_COLLECTION, "calendar");
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      pdfUrl: data.pdfUrl || "",
      buttonTitle: data.buttonTitle || "View Calendar",
      calendarUrl: data.calendarUrl || data.pdfUrl || "",
      url: data.url || data.pdfUrl || "",
      title: data.title || data.buttonTitle || "View Calendar",
      buttonText: data.buttonText || data.buttonTitle || "View Calendar",
    };
  }
  
  // Try fallback to "resource"
  const fallbackRef = doc(db, SETTINGS_COLLECTION, "resource");
  const fallbackSnap = await getDoc(fallbackRef);
  if (fallbackSnap.exists()) {
    const data = fallbackSnap.data();
    return {
      pdfUrl: data.pdfUrl || data.url || "",
      buttonTitle: data.buttonTitle || data.title || "View Calendar",
      calendarUrl: data.calendarUrl || data.pdfUrl || "",
      url: data.url || data.pdfUrl || "",
      title: data.title || data.buttonTitle || "View Calendar",
      buttonText: data.buttonText || data.buttonTitle || "View Calendar",
    };
  }

  // Default values
  return {
    pdfUrl: "/Suvara Calender.pdf",
    buttonTitle: "View Calendar",
  };
};

export const saveCalendarConfig = async (config: CalendarConfig): Promise<void> => {
  const payload = {
    pdfUrl: config.pdfUrl,
    calendarUrl: config.pdfUrl,
    url: config.pdfUrl,
    buttonTitle: config.buttonTitle,
    title: config.buttonTitle,
    buttonText: config.buttonTitle,
    updatedAt: new Date().toISOString(),
  };

  // Write to multiple settings docs to ensure the mobile app picks it up
  const docs = ["calendar", "resource", "calendar_config"];
  for (const docId of docs) {
    const docRef = doc(db, SETTINGS_COLLECTION, docId);
    await setDoc(docRef, payload, { merge: true });
  }
};
