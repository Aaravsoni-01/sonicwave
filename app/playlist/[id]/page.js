'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlayer } from '@/contexts/PlayerContext';
import { playlists } from '@/data/playlists';
import { tracks } from '@/data/tracks';
import { dataStore } from '@/lib/dataStore';

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PlaylistDetail({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { playTrack, state } = usePlayer();
  const { currentTrack, isPlaying } = state || {};
  
  const [playlist, setPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    // Check default playlists
    let foundPlaylist = playlists.find((p) => p.id === params.id);
    
    // Check user created playlists if not found in default
    if (!foundPlaylist) {
      const userPlaylists = dataStore.getUserPlaylists();
      foundPlaylist = userPlaylists.find((p) => p.id === params.id);
    }
    
    if (foundPlaylist) {
      setPlaylist(foundPlaylist);
      
      const plistTracks = foundPlaylist.trackIds
        .map((tid) => tracks.find((t) => t.id === tid))
        .filter(Boolean);
      
      setPlaylistTracks(plistTracks);
      
      const durationSum = plistTracks.reduce((acc, curr) => acc + curr.duration, 0);
      setTotalDuration(durationSum);
    }
  }, [params.id]);

  const handlePlayTrack = (track) => {
    playTrack(track, playlistTracks);
  };

  const handlePlayAll = () => {
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0], playlistTracks);
    }
  };

  if (!playlist) {
    return (
      <div className="playlist-detail animate-fade-in flex-center" style={{ height: '50vh' }}>
        <p>Playlist not found</p>
      </div>
    );
  }

  const durationFormatted = `${Math.floor(totalDuration / 60)} min ${totalDuration % 60} sec`;

  return (
    <div className="playlist-detail animate-fade-in">
      {/* Header Banner */}
      <div
        className="playlist-detail__header"
        style={{
          background: `linear-gradient(180deg, ${playlist.color || '#1DB954'} 0%, var(--bg-primary) 100%)`
        }}
      >
        <div className="playlist-detail__cover-container">
          <img src={playlist.cover || '/images/album_crystal_clear.png'} alt={playlist.name} className="playlist-detail__cover" />
        </div>
        <div className="playlist-detail__info">
          <span className="badge">Playlist</span>
          <h2 className="playlist-detail__title">{playlist.name}</h2>
          <p className="playlist-detail__desc">{playlist.description}</p>
          <div className="playlist-detail__meta">
            <span className="playlist-detail__author">{playlist.createdBy}</span>
            <span className="bullet-divider">•</span>
            <span>{playlistTracks.length} songs</span>
            <span className="bullet-divider">•</span>
            <span className="text-secondary">{durationFormatted}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="playlist-detail__actions">
        <button className="btn btn-primary btn-lg" onClick={handlePlayAll} disabled={playlistTracks.length === 0}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Play
        </button>
        <button className="btn btn-secondary btn-lg" onClick={handlePlayAll} disabled={playlistTracks.length === 0}>
          Shuffle
        </button>
      </div>

      {/* Track List */}
      <div className="playlist-detail__list">
        {playlistTracks.length === 0 ? (
          <div className="track-list-empty">
            <p>No songs in this playlist yet.</p>
            <Link href="/search" className="btn btn-secondary btn-sm">Search and Add Songs</Link>
          </div>
        ) : (
          <div className="track-list">
            <div className="track-list__header">
              <span className="track-list__header-num">#</span>
              <span className="track-list__header-title">Title</span>
              <span className="track-list__header-album">Album</span>
              <span className="track-list__header-duration">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </span>
            </div>
            {playlistTracks.map((track, i) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`track-row ${isCurrent ? 'track-row--active' : ''}`}
                  onClick={() => handlePlayTrack(track)}
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
                    {formatDuration(track.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
