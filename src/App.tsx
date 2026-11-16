import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Music,
  Play,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { CinemaScene } from './components/CinemaScene';
import { cinemaScore } from './utils/cinemaAudio';
import type { MovieEntry } from './types/movie';

export default function App() {
  const [movies, setMovies] = useState<MovieEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodMenuOpen, setMoodMenuOpen] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [inspectedMovie, setInspectedMovie] = useState<MovieEntry | null>(null);
  const [trailerMovie, setTrailerMovie] = useState<MovieEntry | null>(null);
  const wheelLockRef = useRef(0);

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}data/movies.json`;
    fetch(url)
      .then((res) => res.json())
      .then((data: MovieEntry[]) => setMovies(data))
      .catch((err) => console.error('Failed to load movies.json', err));

    return () => cinemaScore.stop();
  }, []);

  const allMoods = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => m.moods.forEach((mood) => set.add(mood)));
    return Array.from(set).sort();
  }, [movies]);

  const filteredMovies = useMemo(() => {
    if (!selectedMood) return movies;
    return movies.filter((m) =>
      m.moods.some((mood) => mood.toLowerCase() === selectedMood.toLowerCase())
    );
  }, [movies, selectedMood]);

  useEffect(() => {
    setActiveIndex(0);
  }, [selectedMood]);

  const activeMovie = filteredMovies[activeIndex] ?? null;

  const stepGallery = (delta: number) => {
    if (filteredMovies.length === 0) return;
    setActiveIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return filteredMovies.length - 1;
      if (next >= filteredMovies.length) return 0;
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inspectedMovie || trailerMovie) return;
      if (e.key === 'ArrowRight') stepGallery(1);
      if (e.key === 'ArrowLeft') stepGallery(-1);
      if (e.key === 'Enter' && activeMovie) setInspectedMovie(activeMovie);
      if (e.key === 'Escape') setMoodMenuOpen(false);
    };

    const handleWheel = (e: WheelEvent) => {
      if (inspectedMovie || trailerMovie) return;
      const now = Date.now();
      if (now - wheelLockRef.current < 260) return;
      const dominant = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(dominant) > 18) {
        wheelLockRef.current = now;
        stepGallery(dominant > 0 ? 1 : -1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  });

  const prescribeRandom = () => {
    if (filteredMovies.length <= 1) return;
    let next = activeIndex;
    while (next === activeIndex) {
      next = Math.floor(Math.random() * filteredMovies.length);
    }
    setActiveIndex(next);
  };

  const toggleMusic = () => {
    const playing = cinemaScore.toggle();
    setMusicPlaying(playing);
  };

  const handleOpenTrailer = (movie: MovieEntry) => {
    if (musicPlaying) {
      cinemaScore.stop();
      setMusicPlaying(false);
    }
    setTrailerMovie(movie);
  };

  return (
    <>
      <div className="film-grain" />

      {filteredMovies.length > 0 && (
        <CinemaScene
          movies={filteredMovies}
          activeIndex={activeIndex}
          onSelectIndex={setActiveIndex}
          onInspectMovie={setInspectedMovie}
        />
      )}

      {/* Top 35mm Archive Marquee Strip */}
      <div className="cinema-ticker" aria-hidden="true">
        <div className="ticker-track">
          <span>
            <b>35MM ARCHIVE</b> &bull; CURATED FOR FUTURE REFLECTION &bull;{' '}
            {movies.map((m) => `${m.title.toUpperCase()} (${m.year})`).join('  ✦  ')}
          </span>
          <span>
            <b>35MM ARCHIVE</b> &bull; CURATED FOR FUTURE REFLECTION &bull;{' '}
            {movies.map((m) => `${m.title.toUpperCase()} (${m.year})`).join('  ✦  ')}
          </span>
        </div>
      </div>

      {/* Grand Proscenium Stage Header */}
      <motion.header
        className="grand-header"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="proscenium-grid">
          {/* Left Wing: Reel Telemetry & Ambient Score */}
          <div className="wing-left">
            <div className="reel-telemetry">
              REEL <strong>{String(activeIndex + 1).padStart(2, '0')}</strong> /{' '}
              {String(filteredMovies.length).padStart(2, '0')}
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`glass-pill-btn ${musicPlaying ? 'active' : ''}`}
              onClick={toggleMusic}
            >
              <span className={`eq-bars ${musicPlaying ? 'playing' : ''}`}>
                <span />
                <span />
                <span />
                <span />
              </span>
              <span>{musicPlaying ? 'Score On' : 'Ambient Score'}</span>
            </motion.button>
          </div>

          {/* Center Monumental Masthead */}
          <div className="masthead-center">
            <div className="projector-flare" />
            <div className="masthead-kicker">
              <span className="masthead-line" />
              <span>PERSONAL CINEMA ARCHIVE</span>
              <span className="masthead-line" />
            </div>
            <motion.h1
              className="grand-title"
              initial={{ letterSpacing: '0.22em', opacity: 0 }}
              animate={{ letterSpacing: '0.08em', opacity: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              Movie Time Capsule
            </motion.h1>
            <div className="masthead-tagline">
              Chapters of Life &bull; Captured in Frame
            </div>
          </div>

          {/* Right Wing: Mood Filter & Random Prescription */}
          <div className="wing-right">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`glass-pill-btn ${selectedMood || moodMenuOpen ? 'active' : ''}`}
              onClick={() => setMoodMenuOpen((v) => !v)}
            >
              <SlidersHorizontal size={14} />
              <span>{selectedMood ?? 'Filter Mood'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-gold"
              onClick={prescribeRandom}
            >
              <Sparkles size={15} />
              <span>Prescribe</span>
            </motion.button>
          </div>
        </div>

        {/* Floating Mood Palette Popover */}
        <AnimatePresence>
          {moodMenuOpen && (
            <motion.div
              className="mood-popover"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mood-popover-inner">
                <button
                  className={`mood-pill ${selectedMood === null ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMood(null);
                    setMoodMenuOpen(false);
                  }}
                >
                  All Moods ({movies.length})
                </button>
                {allMoods.map((mood) => (
                  <button
                    key={mood}
                    className={`mood-pill ${selectedMood === mood ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedMood(mood);
                      setMoodMenuOpen(false);
                    }}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Bottom Active Film Spotlight Card */}
      <AnimatePresence mode="wait">
        {activeMovie && (
          <motion.section
            key={activeMovie.slug}
            className="hud-bottom"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div className="spotlight-top">
              <div>
                <h2 className="spotlight-title">
                  {activeMovie.title}
                  <span>{activeMovie.year}</span>
                </h2>
                <div className="spotlight-sub">
                  Directed by {activeMovie.director} &bull;{' '}
                  {activeMovie.moods.join(' · ')}
                </div>
              </div>

              <div className="nav-controls">
                <button
                  className="icon-btn"
                  aria-label="Previous film"
                  onClick={() => stepGallery(-1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="icon-btn"
                  aria-label="Next film"
                  onClick={() => stepGallery(1)}
                >
                  <ChevronRight size={18} />
                </button>
                {activeMovie.trailerId && (
                  <button
                    className="icon-btn"
                    aria-label="Watch trailer"
                    onClick={() => handleOpenTrailer(activeMovie)}
                  >
                    <Play size={16} />
                  </button>
                )}
                <button
                  className="btn-inspect"
                  onClick={() => setInspectedMovie(activeMovie)}
                >
                  <Film size={15} />
                  Reflections
                </button>
              </div>
            </div>

            <p className="spotlight-context">{activeMovie.lifeContext}</p>

            <div className="scroll-hint">
              SCROLL, USE ARROW KEYS, OR CLICK POSTER TO OPEN JOURNAL ({activeIndex + 1} / {filteredMovies.length})
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Slide-Over Reflection Drawer */}
      <AnimatePresence>
        {inspectedMovie && (
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInspectedMovie(null)}
          >
            <motion.aside
              className="drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-header">
                <div>
                  <span className="eyebrow">
                    {inspectedMovie.year} &bull; {inspectedMovie.director}
                  </span>
                  <h2>{inspectedMovie.title}</h2>
                </div>
                <button className="icon-btn" onClick={() => setInspectedMovie(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="tag-row">
                {inspectedMovie.moods.map((m) => (
                  <span key={m} className="tag">{m}</span>
                ))}
              </div>

              <div className="context-box">
                <span>WHEN IN LIFE TO WATCH</span>
                <p>{inspectedMovie.lifeContext}</p>
              </div>

              {inspectedMovie.memorableQuote && (
                <blockquote className="quote-box">
                  “{inspectedMovie.memorableQuote}”
                </blockquote>
              )}

              {inspectedMovie.soundtrackHighlight && (
                <div className="soundtrack-row">
                  <Music size={15} color="#e2b06e" />
                  <span>{inspectedMovie.soundtrackHighlight}</span>
                </div>
              )}

              {inspectedMovie.trailerId && (
                <button
                  className="btn-gold"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => {
                    handleOpenTrailer(inspectedMovie);
                    setInspectedMovie(null);
                  }}
                >
                  <Play size={15} />
                  Watch Official Trailer
                </button>
              )}

              <div style={{ marginTop: '0.5rem' }}>
                <span className="eyebrow" style={{ marginBottom: '0.75rem' }}>
                  REFLECTIONS OVER TIME
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {inspectedMovie.reflections.map((log, i) => (
                    <div key={i} className="log-card">
                      <div className="log-meta">
                        <span>{log.date}</span>
                        <span>{log.lifeStage}</span>
                      </div>
                      <p>{log.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy-Enhanced YouTube Trailer Modal */}
      <AnimatePresence>
        {trailerMovie && (
          <motion.div
            className="trailer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTrailerMovie(null)}
          >
            <motion.div
              className="trailer-box"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="trailer-top">
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                  {trailerMovie.title} — Trailer
                </strong>
                <button className="icon-btn" onClick={() => setTrailerMovie(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="video-ratio">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${trailerMovie.trailerId}?autoplay=1`}
                  title={`${trailerMovie.title} Trailer`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}