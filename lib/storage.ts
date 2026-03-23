import { supabase } from "@/lib/supabase";

export async function uploadImage(
  file: File,
  folder: "issue" | "complete",
  userId: string
) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const filePath = `${folder}/${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from("maintenance-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from("maintenance-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}