import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
          };
        }
      ) => YTPlayerInstance;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

interface YouTubeSoundtrackProps {
  videoId: string;
  title: string;
}

function sanitizeVideoId(rawId: string): string {
  return rawId.split('&')[0].split('?')[0].trim();
}

export function YouTubeSoundtrack({ videoId, title }: YouTubeSoundtrackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const cleanId = sanitizeVideoId(videoId);

  useEffect(() => {
    let cancelled = false;

    const initPlayer = () => {
      if (cancelled || !containerRef.current || !window.YT?.Player) return;

      // Clear any previous player mount node
      containerRef.current.innerHTML = '';
      const mountNode = document.createElement('div');
      mountNode.title = title;
      containerRef.current.appendChild(mountNode);

      playerRef.current = new window.YT.Player(mountNode, {
        videoId: cleanId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (!cancelled) {
              event.target.playVideo();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }

    return () => {
      cancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors if iframe already unmounted
        }
        playerRef.current = null;
      }
    };
  }, [cleanId, title]);

  return <div ref={containerRef} className="soundtrack-embed-wrap" />;
}