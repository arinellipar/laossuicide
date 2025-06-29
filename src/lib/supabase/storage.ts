// src/lib/supabase/storage.ts
import { supabase } from "./client";

export const AUDIO_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!;
export const MAX_FILE_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE!);

export interface UploadAudioOptions {
  file: File;
  fileName?: string;
  onProgress?: (progress: number) => void;
}

export interface AudioUploadResult {
  url: string;
  path: string;
  size: number;
}

export class SupabaseStorageService {
  static async uploadAudio({
    file,
    fileName,
  }: UploadAudioOptions): Promise<AudioUploadResult> {
    // Validação do arquivo
    if (!file.type.startsWith("audio/")) {
      throw new Error("Invalid file type. Only audio files are allowed.");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Gerar nome único se não fornecido
    const uniqueFileName = fileName || `${Date.now()}-${file.name}`;
    const filePath = `tracks/${uniqueFileName}`;

    // Upload sem suporte a progresso
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
      size: file.size,
    };
  }

  static async deleteAudio(path: string): Promise<void> {
    const { error } = await supabase.storage.from(AUDIO_BUCKET).remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  static async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }
}
