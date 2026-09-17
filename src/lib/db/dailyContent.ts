import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  COLLECTIONS,
  type DailyDevotionalDoc,
  type DailyPrayerDoc,
  type DailyVerseDoc,
} from "@/types/firestore";

/** The full daily-verse pool, ordered — pickForDate (src/lib/dailyContent.ts)
 * picks today's from it client-side, same pattern as fetchLessons. Only
 * called for a signed-in user. */
export async function fetchDailyVerses(): Promise<DailyVerseDoc[]> {
  const snap = await getDocs(query(collection(db!, COLLECTIONS.dailyVerses), orderBy("order")));
  return snap.docs.map((docSnap) => docSnap.data() as DailyVerseDoc);
}

export async function fetchDailyDevotionals(): Promise<DailyDevotionalDoc[]> {
  const snap = await getDocs(
    query(collection(db!, COLLECTIONS.dailyDevotionals), orderBy("order")),
  );
  return snap.docs.map((docSnap) => docSnap.data() as DailyDevotionalDoc);
}

export async function fetchDailyPrayers(): Promise<DailyPrayerDoc[]> {
  const snap = await getDocs(query(collection(db!, COLLECTIONS.dailyPrayers), orderBy("order")));
  return snap.docs.map((docSnap) => docSnap.data() as DailyPrayerDoc);
}
