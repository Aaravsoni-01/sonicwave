'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { tracks } from '@/data/tracks';
import { lyrics } from '@/data/lyrics';

export default function KaraokePage() {
  const { state, playTrack } = usePlayer();
  const { currentTrack, currentTime, isPlaying } = state || {};

  const [micActive, setMicActive] = useState(false);
  const [karaokeLyrics, setKaraokeLyrics] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [performanceStars, setPerformanceStars] = useState(0);

  const prevLineRef = useRef(-1);

  // Load lyrics for track
  useEffect(() => {
    if (currentTrack) {
      const data = lyrics[currentTrack.id];
      if (data && data.lines) {
        setKaraokeLyrics(data.lines);
      } else {
        setKaraokeLyrics([]);
      }
      setCurrentLineIndex(-1);
      setScore(0);
      setShowSummary(false);
      setPerformanceStars(0);
      prevLineRef.current = -1;
    }
  }, [currentTrack]);

  // Track lines during playback
  useEffect(() => {
    if (karaokeLyrics.length === 0 || !isPlaying) return;

    let index = -1;
    for (let i = 0; i < karaokeLyrics.length; i++) {
      if (currentTime >= karaokeLyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }

    setCurrentLineIndex(index);

    // Score generation logic: when active line changes, calculate score increment
    if (index !== -1 && index !== prevLineRef.current && micActive) {
      prevLineRef.current = index;
      
      // Simulate singing performance score (65-95)
      const lineScore = Math.floor(Math.random() * 30) + 65;
      setScore((s) => s + lineScore);

      // If last line reached, trigger summary
      if (index === karaokeLyrics.length - 1) {
        setTimeout(() => {
          setShowSummary(true);
          const finalScore = score + lineScore;
          const stars = Math.min(5, Math.max(1, Math.round(finalScore / (karaokeLyrics.length * 18))));
          setPerformanceStars(stars);
        }, 3000);
      }
    }
  }, [currentTime, karaokeLyrics, isPlaying, micActive]);

  const handleSelectTrack = (track) => {
    playTrack(track, [track]);
  };

  const handleReset = () => {
    setScore(0);
    setShowSummary(false);
    setPerformanceStars(0);
    prevLineRef.current = -1;
  };

  // If no track is playing, show a selector
  if (!currentTrack) {
    return (
      <div className="karaoke-page flex-center flex-column animate-fade-in">
        <div className="karaoke-hero glass text-center">
          <h2>Karaoke Mode</h2>
          <p>Sing along to your favorite tracks! Select a track below to start performing.</p>
        </div>
        <div className="karaoke-selector-grid animate-fade-in-up">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="card-hover karaoke-selector-card flex-gap-sm flex-center"
              onClick={() => handleSelectTrack(track)}
            >
              <img src={track.cover} alt={track.title} />
              <div className="text-left flex-column text-ellipsis">
                <span className="karaoke-selector-card__title text-ellipsis">{track.title}</span>
                <span className="karaoke-selector-card__artist text-ellipsis">{track.artist}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeLine = currentLineIndex !== -1 ? karaokeLyrics[currentLineIndex] : null;
  const nextLine = currentLineIndex + 1 < karaokeLyrics.length ? karaokeLyrics[currentLineIndex + 1] : null;

  return (
    <div className="karaoke-page animate-fade-in">
      {/* Stage lights effect */}
      <div className={`karaoke-stage-lights ${micActive && isPlaying ? 'karaoke-stage-lights--active' : ''}`} />

      {/* Main Karaoke View */}
      {showSummary ? (
        <div className="karaoke-summary glass animate-scale-in text-center flex-column flex-center">
          <span className="karaoke-summary__trophy">🏆</span>
          <h3>Performance Complete!</h3>
          <p>Great job! Here is your final karaoke score:</p>
          <div className="karaoke-summary__score">{score} Points</div>
          <div className="karaoke-summary__stars flex-gap-sm">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`star ${i < performanceStars ? 'star--active' : ''}`}>
                ★
              </span>
            ))}
          </div>
          <div className="flex-gap-md" style={{ marginTop: '24px' }}>
            <button className="btn btn-primary" onClick={handleReset}>
              Sing Again
            </button>
            <button className="btn btn-secondary" onClick={() => playTrack(null)}>
              Change Track
            </button>
          </div>
        </div>
      ) : (
        <div className="karaoke-display-container flex-column flex-between">
          {/* Header row */}
          <div className="karaoke-hud glass flex-between">
            <div className="flex-gap-sm flex-center">
              <img src={currentTrack.cover} alt={currentTrack.title} className="karaoke-hud__art" />
              <div>
                <h4>{currentTrack.title}</h4>
                <p>{currentTrack.artist}</p>
              </div>
            </div>
            <div className="flex-gap-md flex-center">
              <div className="karaoke-score-pill">
                <span>Score:</span>
                <strong>{score}</strong>
              </div>
              <button 
                className={`btn ${micActive ? 'btn-primary' : 'btn-secondary'} btn-sm flex-center`}
                onClick={() => setMicActive(!micActive)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
                {micActive ? 'Mic Active' : 'Mic Off'}
              </button>
            </div>
          </div>

          {/* Lyrics Prompt */}
          <div className="karaoke-lyrics-prompt text-center">
            {micActive && isPlaying && (
              <div className="rhythm-dots flex-center">
                <span className="dot dot--1" />
                <span className="dot dot--2" />
                <span className="dot dot--3" />
              </div>
            )}
            
            {activeLine ? (
              <div className="karaoke-lyrics-lines animate-fade-in">
                <p className="line-current">{activeLine.text}</p>
                {nextLine && <p className="line-next">{nextLine.text}</p>}
              </div>
            ) : (
              <div className="karaoke-lyrics-lines">
                <p className="line-current">♪ Get Ready ♪</p>
                {karaokeLyrics.length > 0 && <p className="line-next">{karaokeLyrics[0].text}</p>}
              </div>
            )}
          </div>

          {/* Tips or mic warning */}
          <div className="karaoke-footer glass text-center">
            {!micActive ? (
              <p className="text-secondary">⚠️ Turn on your microphone button to record points while you sing!</p>
            ) : !isPlaying ? (
              <p className="text-secondary">▶️ Press play in the control bar to start the track.</p>
            ) : (
              <p className="text-accent gradient-text">🎤 Sing now! Keep on rhythm to gain maximum points!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
