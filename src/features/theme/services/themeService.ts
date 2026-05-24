import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";

export interface ProgramListItem {
    title: string;
    desc: string;
    iconName: string;
}

export interface ThemeProgramsData {
    themeYear: string;
    themeMalayalam: string;
    themeEnglish: string;
    programs: ProgramListItem[];
}

const SETTINGS_COLLECTION = "settings";
const THEME_DOC_ID = "theme_programs";

export const getThemePrograms = async (): Promise<ThemeProgramsData> => {
    const docRef = doc(db, SETTINGS_COLLECTION, THEME_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            themeYear: data.themeYear || "2025-2026",
            themeMalayalam: data.themeMalayalam || "“നിത്യജീവനിലുള്ള പ്രത്യാശ”",
            themeEnglish: data.themeEnglish || "Hope in Eternal Life",
            programs: data.programs || [],
        };
    } else {
        // Default values if no document exists
        return {
            themeYear: "2025-2026",
            themeMalayalam: "“നിത്യജീവനിലുള്ള പ്രത്യാശ”",
            themeEnglish: "Hope in Eternal Life",
            programs: [
                {
                    title: "Uthanothsavam",
                    desc: "An integral and intensive 5-day formation for catechetical students.",
                    iconName: "fire",
                },
                {
                    title: "BTC & CTC Course",
                    desc: "Catechists’ Training Course designed to equip teachers.",
                    iconName: "bookOpenReader",
                },
            ],
        };
    }
};

export const saveThemePrograms = async (data: ThemeProgramsData): Promise<void> => {
    const docRef = doc(db, SETTINGS_COLLECTION, THEME_DOC_ID);
    await setDoc(docRef, data, { merge: true });
};
