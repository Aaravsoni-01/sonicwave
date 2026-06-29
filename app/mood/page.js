'use client';

import { useState } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { tracks } from '@/data/tracks';
import { recommendations } from '@/lib/recommendations';
import { dataStore } from '@/lib/dataStore';

const MOODS = [
  { id: 'dreamy', label: 'Dreamy', emoji: '🌙', color: 'linear-gradient(135deg, #7c3aed, #a855f7)' },
  { id: 'chill', label: 'Chill', emoji: '😌', color: 'linear-gradient(135deg, #10b981, #059669)' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { id: 'focus', label: 'Focus', emoji: '🎯', color: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  { id: 'happy', label: 'Happy', emoji: '😊', color: 'linear-gradient(135deg, #ec4899, #db2777)' },
  { id: 'night', label: 'Night Drive', emoji: '🌃', color: 'linear-gradient(135deg, #1e1b4b, #312e81)' },
  { id: 'party', label: 'Party', emoji: '🎉', color: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  { id: 'workout', label: 'Workout', emoji: '🏋️', color: 'linear-gradient(135deg, #14b8a6, #0d9488)' }
];

export default function MoodPage() {
  const { playTrack, state } = usePlayer();
  const { currentTrack, isPlaying } = state || {};

  const [selectedMood, setSelectedMood] = useState(null);
  const [generatedTracks, setGeneratedTracks] = useState([]);
  const [playlistName, setPlaylistName] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSelectMood = (mood) => {
    setSelectedMood(mood);
    const result = recommendations.getForMood(mood.id, 8);
    setGeneratedTracks(result);
    setPlaylistName(`${mood.label} Flow Mix`);
    setSaved(false);
  };

  const handlePlayAll = () => {
    if (generatedTracks.length > 0) {
      playTrack(generatedTracks[0], generatedTracks);
    }
  };

  const handleSavePlaylist = () => {
    if (!playlistName || generatedTracks.length === 0) return;
    
    // Create custom playlist and add tracks
    const pid = dataStore.createPlaylist(playlistName, `AI-Generated mix for ${selectedMood.label} mood.`);
    generatedTracks.forEach((track) => {
      dataStore.addTrackToPlaylist(pid, track.id);
    });
    setSaved(true);
  };

  return (
    <div 
      className="mood-page animate-fade-in"
      style={{
        '--selected-bg': selectedMood ? selectedMood.color.split(',')[1].trim().replace(')', '') : '#12121f'
      }}
    >
      {/* Title Hero */}
      <div className="mood-hero glass">
        <h2>Mood Mix Generator</h2>
        <p>Pick a vibe. Our AI recommendation system will build a custom playlist matching your current energy.</p>
      </div>

      {/* Mood Picker */}
      <div className="mood-grid">
        {MOODS.map((mood) => (
          <div
            key={mood.id}
            className={`mood-card glass-hover ${selectedMood?.id === mood.id ? 'mood-card--active' : ''}`}
            style={{ '--mood-gradient': mood.color }}
            onClick={() => handleSelectMood(mood)}
          >
            <span className="mood-card__emoji">{mood.emoji}</span>
            <span className="mood-card__label">{mood.label}</span>
          </div>
        ))}
      </div>

      {/* Generated Playlist Detail */}
      {selectedMood && (
        <div className="mood-result glass animate-fade-in-up">
          <div className="mood-result__header flex-between">
            <div>
              <span className="badge">Vibe Selected</span>
              <h3>{playlistName}</h3>
              <p>{generatedTracks.length} tracks matched for your mood.</p>
            </div>
            <div className="mood-result__actions flex-gap-sm">
              <button className="btn btn-primary" onClick={handlePlayAll} disabled={generatedTracks.length === 0}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play Vibe
              </button>
              <button className="btn btn-secondary" onClick={handleSavePlaylist} disabled={saved}>
                {saved ? 'Saved to Library ✓' : 'Save to Library'}
              </button>
            </div>
          </div>

          <div className="playlist-detail__list">
            {generatedTracks.length === 0 ? (
              <p style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No tracks currently fit this mood perfectly. We will generate recommendations from other albums soon!
              </p>
            ) : (
              <div className="track-list">
                {generatedTracks.map((track, i) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`track-row ${isCurrent ? 'track-row--active' : ''}`}
                      onClick={() => playTrack(track, generatedTracks)}
                    >
                      <div className="track-row__number-col">
                        {isCurrent && isPlaying ? (
                          <div className="mini-equalizer mini-equalizer--playing">
                            <span className="mini-equalizer__bar" />
                            <span className="mini-equalizer__bar" />
                            <span className="mini-equalizer__bar" />
                          </div>
                        ) : (
                          <span className="track-row__number">{i + 1}</span>
                        )}
                        <button className="track-row__play-btn" aria-label="Play">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </button>
                      </div>
                      <img src={track.cover} alt={track.title} className="track-row__img" />
                      <div className="track-row__info">
                        <span className="track-row__title text-ellipsis">{track.title}</span>
                        <span className="track-row__artist text-ellipsis">{track.artist}</span>
                      </div>
                      <span className="track-row__album text-ellipsis">{track.album}</span>
                      <span className="track-row__duration">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
