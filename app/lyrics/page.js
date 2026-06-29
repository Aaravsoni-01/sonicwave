'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { lyrics } from '@/data/lyrics';

export default function LyricsPage() {
  const { state } = usePlayer();
  const { currentTrack, currentTime, isPlaying } = state || {};
  
  const containerRef = useRef(null);
  const activeLineRef = useRef(null);
  
  const [trackLyrics, setTrackLyrics] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (currentTrack) {
      const data = lyrics[currentTrack.id];
      if (data && data.lines) {
        setTrackLyrics(data.lines);
      } else {
        setTrackLyrics([]);
      }
    } else {
      setTrackLyrics([]);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (trackLyrics.length === 0) return;
    
    // Find active lyric index based on currentTime
    let index = -1;
    for (let i = 0; i < trackLyrics.length; i++) {
      if (currentTime >= trackLyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    setActiveIndex(index);
  }, [currentTime, trackLyrics]);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  if (!currentTrack) {
    return (
      <div className="lyrics-page lyrics-page--empty flex-center animate-fade-in">
        <div className="lyrics-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/>
          </svg>
          <h3>No Music Playing</h3>
          <p>Play a song to view real-time synchronized lyrics here.</p>
        </div>
      </div>
    );
  }

  const hasLyrics = trackLyrics.length > 0;

  return (
    <div 
      className="lyrics-page animate-fade-in"
      style={{
        '--album-color': currentTrack.genre === 'Electronic' ? '#7c3aed' :
                          currentTrack.genre === 'Rock' ? '#ef4444' :
                          currentTrack.genre === 'Hip-Hop' ? '#f97316' :
                          currentTrack.genre === 'Indie Folk' ? '#1DB954' : '#ec4899'
      }}
    >
      {/* Blurred background overlay */}
      <div 
        className="lyrics-background"
        style={{ backgroundImage: `url(${currentTrack.cover})` }}
      />
      
      {/* Header Info */}
      <div className="lyrics-header-card glass">
        <img src={currentTrack.cover} alt={currentTrack.title} className="lyrics-header-card__art" />
        <div className="lyrics-header-card__info">
          <h2>{currentTrack.title}</h2>
          <p>{currentTrack.artist} • {currentTrack.album}</p>
        </div>
      </div>

      {/* Lyrics Scroll Container */}
      <div className="lyrics-container" ref={containerRef}>
        {hasLyrics ? (
          trackLyrics.map((line, index) => {
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;
            
            return (
              <p
                key={index}
                ref={isActive ? activeLineRef : null}
                className={`lyrics-line ${isActive ? 'lyrics-line--active' : ''} ${isPast ? 'lyrics-line--past' : ''}`}
                style={{
                  transitionDelay: isActive ? '0s' : '0.05s'
                }}
              >
                {line.text}
              </p>
            );
          })
        ) : (
          <div className="lyrics-empty-state">
            <h3>No lyrics found</h3>
            <p>We don't have synchronized lyrics for this song yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
