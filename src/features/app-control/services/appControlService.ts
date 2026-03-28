import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";

export interface CarouselItem {
    name: string;
    role: string;
    label: string;
    message: string;
    image: string;
}

export interface LoginScreenConfig {
    verseTitle: string;
    verseText: string;
    verseRef: string;
    verseBgImage: string;
    verseTextColor: "white" | "black" | "gold" | "blue" | null;
    verseTitleBgColor?: "white" | "black" | "gold" | "blue" | null;
    hideVerseText?: boolean;
    carousel: CarouselItem[];
}

export interface AppThemeConfig {
    bannerUrl: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
}

const SETTINGS_COLLECTION = "settings";
const LOGIN_CONFIG_DOC = "login_screen_config";
const APP_THEME_DOC = "app_theme";

export const getLoginScreenConfig = async (): Promise<LoginScreenConfig> => {
    const docRef = doc(db, SETTINGS_COLLECTION, LOGIN_CONFIG_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as LoginScreenConfig;
    } else {
        return {
            verseTitle: "Daily Verse",
            verseText: "",
            verseRef: "",
            verseBgImage: "",
            verseTextColor: "white",
            verseTitleBgColor: "gold",
            hideVerseText: false,
            carousel: [],
        };
    }
};

export const saveLoginScreenConfig = async (config: LoginScreenConfig): Promise<void> => {
    const docRef = doc(db, SETTINGS_COLLECTION, LOGIN_CONFIG_DOC);
    await setDoc(docRef, config, { merge: true });
};

export const getAppThemeConfig = async (): Promise<AppThemeConfig> => {
    const docRef = doc(db, SETTINGS_COLLECTION, APP_THEME_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as AppThemeConfig;
    } else {
        return {
            bannerUrl: "",
            primaryColor: "#1E3A8A",
            secondaryColor: "#BC8A3A",
            fontFamily: "Outfit",
        };
    }
};

export const saveAppThemeConfig = async (config: AppThemeConfig): Promise<void> => {
    const docRef = doc(db, SETTINGS_COLLECTION, APP_THEME_DOC);
    await setDoc(docRef, config, { merge: true });
};
