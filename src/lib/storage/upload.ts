import { put } from "@vercel/blob";

export async function uploadClothingImage(
  file: File,
  userId: string
): Promise<string> {
  const filename = `closet/${userId}/${Date.now()}-${file.name}`;
  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: true,
  });
  return blob.url;
}

/**
 * Fallback for private blob stores — uses no access flag
 * which defaults to the store's configured access level.
 */
export async function uploadClothingImagePrivate(
  file: File,
  userId: string
): Promise<string> {
  const filename = `closet/${userId}/${Date.now()}-${file.name}`;
  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: true,
  });
  return blob.url;
}
