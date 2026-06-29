'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePlayer } from '@/contexts/PlayerContext';
import { tracks } from '@/data/tracks';
import { albums } from '@/data/albums';
import { artists } from '@/data/artists';
import { playlists } from '@/data/playlists';

const GENRES = [
  { name: 'Electronic', color: 'linear-gradient(135deg, #7c3aed, #ec4899)' },
  { name: 'EDM', color: 'linear-gradient(135deg, #f97316, #ec4899)' },
  { name: 'Indie Folk', color: 'linear-gradient(135deg, #1DB954, #158f3e)' },
  { name: 'Synthwave', color: 'linear-gradient(135deg, #3b82f6, #7c3aed)' },
  { name: 'Rock', color: 'linear-gradient(135deg, #ef4444, #f97316)' },
  { name: 'Ambient', color: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' },
  { name: 'Hip-Hop', color: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
  { name: 'Acoustic', color: 'linear-gradient(135deg, #10b981, #047857)' }
];

export default function Search() {
  const { playTrack, state } = usePlayer();
  const { currentTrack, isPlaying } = state || {};
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, songs, artists, albums, playlists

  const filteredTracks = tracks.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase()) ||
    t.artist.toLowerCase().includes(query.toLowerCase()) ||
    t.genre.toLowerCase().includes(query.toLowerCase())
  );

  const filteredArtists = artists.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.genres.some((g) => g.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredAlbums = albums.filter((al) =>
    al.title.toLowerCase().includes(query.toLowerCase()) ||
    al.artistName.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPlaylists = playlists.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase())
  );

  const hasResults = query.trim() !== '' && (
    filteredTracks.length > 0 ||
    filteredArtists.length > 0 ||
    filteredAlbums.length > 0 ||
    filteredPlaylists.length > 0
  );

  const handlePlayTrack = (track, queue) => {
    playTrack(track, queue);
  };

  return (
    <div className="search-page animate-fade-in">
      {/* Search Input Area */}
      <div className="search-bar-container">
        <div className="search-bar">
          <svg className="search-bar__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="search-bar__input"
            placeholder="Search songs, artists, albums, or playlists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-bar__clear" onClick={() => setQuery('')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      {query.trim() !== '' && (
        <div className="search-filters">
          {['all', 'songs', 'artists', 'albums', 'playlists'].map((filter) => (
            <button
              key={filter}
              className={`chip ${activeFilter === filter ? 'chip--active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {query.trim() !== '' ? (
        hasResults ? (
          <div className="search-results animate-fade-in-up">
            {/* Top Result Card & Songs (Only on 'all' or specific filters) */}
            {(activeFilter === 'all' || activeFilter === 'songs') && filteredTracks.length > 0 && (
              <div className="search-results__grid">
                {activeFilter === 'all' && (
                  <div className="top-result">
                    <h3 className="search-heading">Top Result</h3>
                    <div className="top-result__card glass-hover" onClick={() => handlePlayTrack(filteredTracks[0], filteredTracks)}>
                      <img src={filteredTracks[0].cover} alt={filteredTracks[0].title} className="top-result__art" />
                      <h4 className="top-result__title text-ellipsis">{filteredTracks[0].title}</h4>
                      <div className="top-result__meta">
                        <span className="badge">Song</span>
                        <span className="top-result__artist">{filteredTracks[0].artist}</span>
                      </div>
                      <button className="card-play-btn" aria-label="Play">
                        {currentTrack?.id === filteredTracks[0].id && isPlaying ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="songs-result" style={{ gridColumn: activeFilter === 'all' ? 'span 2' : 'span 3' }}>
                  <h3 className="search-heading">Songs</h3>
                  <div className="track-list">
                    {filteredTracks.slice(0, activeFilter === 'all' ? 4 : 20).map((track, i) => (
                      <div
                        key={track.id}
                        className={`track-row ${currentTrack?.id === track.id ? 'track-row--active' : ''}`}
                        onClick={() => handlePlayTrack(track, filteredTracks)}
                      >
                        <div className="track-row__number-col">
                          {currentTrack?.id === track.id && isPlaying ? (
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
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Artists Result */}
            {(activeFilter === 'all' || activeFilter === 'artists') && filteredArtists.length > 0 && (
              <div className="search-section">
                <h3 className="search-heading">Artists</h3>
                <div className="carousel">
                  {filteredArtists.map((artist) => (
                    <Link key={artist.id} href={`/artist/${artist.id}`} className="card-hover home-track-card home-track-card--artist">
                      <div className="home-track-card__art home-track-card__art--circle">
                        <img src={artist.image} alt={artist.name} />
                      </div>
                      <div className="home-track-card__info text-center">
                        <span className="home-track-card__title text-ellipsis">{artist.name}</span>
                        <span className="home-track-card__artist text-ellipsis">Artist</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Albums Result */}
            {(activeFilter === 'all' || activeFilter === 'albums') && filteredAlbums.length > 0 && (
              <div className="search-section">
                <h3 className="search-heading">Albums</h3>
                <div className="carousel">
                  {filteredAlbums.map((album) => (
                    <Link key={album.id} href={`/album/${album.id}`} className="card-hover home-track-card">
                      <div className="home-track-card__art">
                        <img src={album.cover} alt={album.title} />
                      </div>
                      <div className="home-track-card__info">
                        <span className="home-track-card__title text-ellipsis">{album.title}</span>
                        <span className="home-track-card__artist text-ellipsis">{album.artistName}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Playlists Result */}
            {(activeFilter === 'all' || activeFilter === 'playlists') && filteredPlaylists.length > 0 && (
              <div className="search-section">
                <h3 className="search-heading">Playlists</h3>
                <div className="carousel">
                  {filteredPlaylists.map((playlist) => (
                    <Link key={playlist.id} href={`/playlist/${playlist.id}`} className="card-hover home-track-card">
                      <div className="home-track-card__art">
                        <img src={playlist.cover} alt={playlist.name} />
                      </div>
                      <div className="home-track-card__info">
                        <span className="home-track-card__title text-ellipsis">{playlist.name}</span>
                        <span className="home-track-card__artist text-ellipsis">{playlist.description}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="search-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <p>No results found for "{query}"</p>
            <span>Check spelling or try searching another keyword.</span>
          </div>
        )
      ) : (
        /* Browse Categories when query is empty */
        <div className="search-browse animate-fade-in-up">
          <h3 className="search-heading">Browse Categories</h3>
          <div className="search-browse__grid">
            {GENRES.map((genre) => (
              <div
                key={genre.name}
                className="genre-card"
                style={{ background: genre.color }}
                onClick={() => setQuery(genre.name)}
              >
                <span className="genre-card__name">{genre.name}</span>
                <div className="genre-card__overlay-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
