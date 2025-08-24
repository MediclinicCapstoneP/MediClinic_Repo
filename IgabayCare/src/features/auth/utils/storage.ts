import { supabase } from "../../../supabaseClient";

export const upload = async (
  file: File,
  filePath: string
): Promise<string | null> => {
  try {
    const { error } = await supabase.storage
      .from("user-uploads")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from("user-uploads").getPublicUrl(filePath);

    return data?.publicUrl || null;
  } catch (err: any) {
    console.error("Upload Error:", err.message);
    throw new Error("There was an issue uploading the file.");
  }
};