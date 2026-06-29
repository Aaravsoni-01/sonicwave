'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlayer } from '@/contexts/PlayerContext';
import { playlists } from '@/data/playlists';
import { albums } from '@/data/albums';
import { artists } from '@/data/artists';
import { tracks } from '@/data/tracks';
import { dataStore } from '@/lib/dataStore';

export default function Library() {
  const { playTrack, state } = usePlayer();
  const { currentTrack, isPlaying } = state || {};

  const [activeTab, setActiveTab] = useState('playlists'); // playlists, albums, artists, liked
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const loadData = () => {
    // User Playlists
    const storedUserPlaylists = dataStore.getUserPlaylists();
    setUserPlaylists(storedUserPlaylists);

    // Liked Songs
    const likedSet = dataStore.getLikedTracks();
    const likedList = tracks.filter((t) => likedSet.has(t.id));
    setLikedTracks(likedList);
  };

  useEffect(() => {
    loadData();
  }, [currentTrack]);

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    dataStore.createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setShowCreateModal(false);
    loadData();
  };

  const handlePlayTrack = (track, list) => {
    playTrack(track, list);
    dataStore.addToHistory(track.id);
  };

  return (
    <div className="library-page animate-fade-in">
      {/* Top Controls */}
      <div className="library-header flex-between">
        <div className="library-tabs">
          {[
            { id: 'playlists', label: 'Playlists' },
            { id: 'albums', label: 'Albums' },
            { id: 'artists', label: 'Artists' },
            { id: 'liked', label: 'Liked Songs' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`library-tab-btn ${activeTab === tab.id ? 'library-tab-btn--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'playlists' && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Create Playlist
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="library-content animate-fade-in-up">
        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          <div className="library-grid">
            {/* System Playlists */}
            {playlists.map((playlist) => (
              <Link key={playlist.id} href={`/playlist/${playlist.id}`} className="card-hover library-card">
                <img src={playlist.cover} alt={playlist.name} className="library-card__img" />
                <h4 className="library-card__title text-ellipsis">{playlist.name}</h4>
                <p className="library-card__desc text-clamp-2">{playlist.description}</p>
              </Link>
            ))}
            {/* User Playlists */}
            {userPlaylists.map((playlist) => (
              <Link key={playlist.id} href={`/playlist/${playlist.id}`} className="card-hover library-card">
                <img src={playlist.cover || '/images/album_crystal_clear.png'} alt={playlist.name} className="library-card__img" />
                <h4 className="library-card__title text-ellipsis">{playlist.name}</h4>
                <p className="library-card__desc text-clamp-2">{playlist.description || 'Custom user playlist'}</p>
              </Link>
            ))}
          </div>
        )}

        {/* Albums Tab */}
        {activeTab === 'albums' && (
          <div className="library-grid">
            {albums.map((album) => (
              <Link key={album.id} href={`/album/${album.id}`} className="card-hover library-card">
                <img src={album.cover} alt={album.title} className="library-card__img" />
                <h4 className="library-card__title text-ellipsis">{album.title}</h4>
                <p className="library-card__desc text-ellipsis">{album.artistName}</p>
              </Link>
            ))}
          </div>
        )}

        {/* Artists Tab */}
        {activeTab === 'artists' && (
          <div className="library-grid library-grid--artists">
            {artists.map((artist) => (
              <Link key={artist.id} href={`/artist/${artist.id}`} className="card-hover library-card library-card--artist">
                <img src={artist.image} alt={artist.name} className="library-card__img library-card__img--circle" />
                <h4 className="library-card__title text-ellipsis">{artist.name}</h4>
                <p className="library-card__desc text-ellipsis">Artist</p>
              </Link>
            ))}
          </div>
        )}

        {/* Liked Songs Tab */}
        {activeTab === 'liked' && (
          likedTracks.length === 0 ? (
            <div className="library-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              <p>Songs you like will appear here</p>
              <Link href="/search" className="btn btn-secondary btn-sm">Find songs to like</Link>
            </div>
          ) : (
            <div className="track-list">
              {likedTracks.map((track, i) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className={`track-row ${isCurrent ? 'track-row--active' : ''}`}
                    onClick={() => handlePlayTrack(track, likedTracks)}
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
          )
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="modal-overlay flex-center animate-fade-in">
          <div className="modal-content glass animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex-between">
              <h3>Create Playlist</h3>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreatePlaylist} className="modal-form">
              <div className="form-group">
                <label htmlFor="pname">Name</label>
                <input
                  type="text"
                  id="pname"
                  className="input"
                  placeholder="My Playlist"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="pdesc">Description (Optional)</label>
                <textarea
                  id="pdesc"
                  className="input"
                  rows="3"
                  placeholder="Add an optional description"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                />
              </div>
              <div className="modal-actions flex-end">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
