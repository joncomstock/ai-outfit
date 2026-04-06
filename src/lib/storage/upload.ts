import { put } from "@vercel/blob";

export async function uploadClothingImage(
  file: File,
  userId: string
): Promise<string> {
  const filename = `closet/${userId}/${Date.now()}-${file.name}`;
  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type,
  });
  return blob.url;
}
