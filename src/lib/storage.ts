import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

const MAX_BYTES = 5 * 1024 * 1024;

/** Uploads a profile photo to avatars/{uid} (overwriting any previous one)
 * and returns its public download URL. Mirrors the size/type limits in
 * storage.rules client-side for a fast, clear error — the rules are the
 * real enforcement. */
export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("That image is too large — please choose one under 5MB.");
  }
  const fileRef = ref(storage!, `avatars/${uid}`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}
