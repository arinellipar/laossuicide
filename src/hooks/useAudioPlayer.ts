// src/hooks/useAudioPlayer.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { Howl, HowlOptions } from "howler";

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  error: string | null;
}

export interface UseAudioPlayerOptions {
  autoPlay?: boolean;
  volume?: number;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onLoad?: () => void;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    isLoading: false,
    duration: 0,
    currentTime: 0,
    volume: options.volume ?? 1,
    isMuted: false,
    error: null,
  });

  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  // Atualizar tempo atual
  const updateTime = useCallback(() => {
    if (howlRef.current && state.isPlaying) {
      setState((prev) => ({
        ...prev,
        currentTime: howlRef.current?.seek() || 0,
      }));
      rafRef.current = requestAnimationFrame(updateTime);
    }
  }, [state.isPlaying]);

  // Carregar nova faixa
  const load = useCallback(
    (src: string) => {
      // Limpar instância anterior
      if (howlRef.current) {
        howlRef.current.unload();
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const howlOptions: HowlOptions = {
        src: [src],
        html5: true,
        volume: state.volume,
        onload: () => {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            duration: howlRef.current?.duration() || 0,
          }));
          options.onLoad?.();
        },
        onplay: () => {
          setState((prev) => ({ ...prev, isPlaying: true }));
          updateTime();
        },
        onpause: () => {
          setState((prev) => ({ ...prev, isPlaying: false }));
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
          }
        },
        onstop: () => {
          setState((prev) => ({
            ...prev,
            isPlaying: false,
            currentTime: 0,
          }));
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
          }
        },
        onend: () => {
          setState((prev) => ({
            ...prev,
            isPlaying: false,
            currentTime: 0,
          }));
          options.onEnd?.();
        },
      };

      howlRef.current = new Howl(howlOptions);

      howlRef.current.on("loaderror", (_id, error) => {
        const errorMessage =
          typeof error === "string" ? error : "Failed to load audio";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        options.onError?.(new Error(errorMessage));
      });

      howlRef.current.on("playerror", (_id, error) => {
        const errorMessage =
          typeof error === "string" ? error : "Failed to play audio";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        options.onError?.(new Error(errorMessage));
      });

      if (options.autoPlay) {
        howlRef.current.play();
      }
    },
    [state.volume, options, updateTime]
  );

  // Controles de reprodução
  const play = useCallback(() => {
    howlRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    howlRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    howlRef.current?.stop();
  }, []);

  const seek = useCallback((time: number) => {
    if (howlRef.current) {
      howlRef.current.seek(time);
      setState((prev) => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    howlRef.current?.volume(clampedVolume);
    setState((prev) => ({ ...prev, volume: clampedVolume }));
  }, []);

  const toggleMute = useCallback(() => {
    if (howlRef.current) {
      const newMutedState = !state.isMuted;
      howlRef.current.mute(newMutedState);
      setState((prev) => ({ ...prev, isMuted: newMutedState }));
    }
  }, [state.isMuted]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      howlRef.current?.unload();
    };
  }, []);

  return {
    state,
    load,
    play,
    pause,
    stop,
    seek,
    setVolume,
    toggleMute,
  };
}
