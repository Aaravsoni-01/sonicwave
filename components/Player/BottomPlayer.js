'use client';

import { usePlayer } from '@/contexts/PlayerContext';
import { useState, useRef, useEffect } from 'react';
import { dataStore } from '@/lib/dataStore';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function BottomPlayer() {
  const {
    state,
    pause,
    resume,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    toggleQueue,
    toggleLyrics,
  } = usePlayer();

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    showQueue,
    showLyrics,
  } = state;

  const [liked, setLiked] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const progressRef = useRef(null);
  const volumeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (currentTrack) {
      setLiked(dataStore.isLiked(currentTrack.id));
    }
  }, [currentTrack]);

  const handleLike = () => {
    if (!currentTrack) return;
    const newState = dataStore.toggleLike(currentTrack.id);
    setLiked(newState);
  };

  const handleSeek = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(percent * duration);
  };

  const handleVolumeChange = (e) => {
    const rect = volumeRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(percent);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentTrack) {
    return (
      <div className="player">
        <div className="player__empty">
          <p>Select a track to start listening</p>
        </div>
      </div>
    );
  }

  return (
    <div className="player">
      {/* Track Info */}
      <div className="player__track-info">
        <div className="player__album-art">
          <img src={currentTrack.cover} alt={currentTrack.title} />
          <div className="player__album-art-overlay">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M15 3H6c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-5-5zm-1 12v2c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2H8c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1h2V9c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v2h2c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1h-2z"/>
            </svg>
          </div>
        </div>
        <div className="player__track-text">
          <span className="player__track-title text-ellipsis">{currentTrack.title}</span>
          <span className="player__track-artist text-ellipsis">{currentTrack.artist}</span>
        </div>
        <button
          className={`btn-icon player__like-btn ${liked ? 'player__like-btn--active' : ''}`}
          onClick={handleLike}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#1DB954' : 'none'} stroke={liked ? '#1DB954' : 'currentColor'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>
      </div>

      {/* Player Controls */}
      <div className="player__controls">
        <div className="player__buttons">
          <button
            className={`btn-icon player__control-btn ${shuffle ? 'player__control-btn--active' : ''}`}
            onClick={toggleShuffle}
            aria-label="Shuffle"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>
          <button className="btn-icon player__control-btn" onClick={prev} aria-label="Previous">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button
            className="player__play-btn"
            onClick={isPlaying ? pause : resume}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          <button className="btn-icon player__control-btn" onClick={next} aria-label="Next">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
          <button
            className={`btn-icon player__control-btn ${repeat !== 'off' ? 'player__control-btn--active' : ''}`}
            onClick={cycleRepeat}
            aria-label={`Repeat: ${repeat}`}
          >
            {repeat === 'one' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="player__progress">
          <span className="player__time">{formatTime(currentTime)}</span>
          <div
            className="player__progress-bar"
            ref={progressRef}
            onClick={handleSeek}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
          >
            <div className="player__progress-bg">
              <div className="player__progress-fill" style={{ width: `${progress}%` }}>
                <div className="player__progress-thumb" />
              </div>
            </div>
          </div>
          <span className="player__time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Extra Controls */}
      <div className="player__extra">
        <button
          className={`btn-icon player__extra-btn ${showLyrics ? 'player__extra-btn--active' : ''}`}
          onClick={toggleLyrics}
          aria-label="Lyrics"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/>
          </svg>
        </button>
        <button
          className={`btn-icon player__extra-btn ${showQueue ? 'player__extra-btn--active' : ''}`}
          onClick={toggleQueue}
          aria-label="Queue"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
          </svg>
        </button>

        {/* Volume */}
        <div className="player__volume" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
          <button className="btn-icon player__extra-btn" aria-label="Volume">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              {(isMuted || volume === 0) ? (
                <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              ) : volume < 0.5 ? (
                <path d="M18.5 12A4.5 4.5 0 0016 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
              ) : (
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              )}
            </svg>
          </button>
          <div className={`player__volume-slider ${showVolumeSlider ? 'player__volume-slider--visible' : ''}`}>
            <div
              className="player__volume-bar"
              ref={volumeRef}
              onClick={handleVolumeChange}
              role="slider"
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(volume * 100)}
            >
              <div className="player__volume-bg">
                <div className="player__volume-fill" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}>
                  <div className="player__volume-thumb" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
