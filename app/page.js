'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePlayer } from '@/contexts/PlayerContext';
import { tracks } from '@/data/tracks';
import { albums } from '@/data/albums';
import { artists } from '@/data/artists';
import { playlists } from '@/data/playlists';
import { recommendations } from '@/lib/recommendations';
import { dataStore } from '@/lib/dataStore';

export default function Home() {
  const { playTrack, state } = usePlayer();
  const { currentTrack, isPlaying } = state || {};
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [timeBasedRecs, setTimeBasedRecs] = useState([]);

  useEffect(() => {
    // Load recently played tracks
    const historyIds = dataStore.getRecentlyPlayed(6);
    if (historyIds && historyIds.length > 0) {
      const historyTracks = historyIds
        .map((id) => tracks.find((t) => t.id === id))
        .filter(Boolean);
      setRecentlyPlayed(historyTracks);
    } else {
      // Fallback: show first 6 tracks
      setRecentlyPlayed(tracks.slice(0, 6));
    }

    // Load personalized recommendations
    setPersonalizedRecs(recommendations.getPersonalized(6));

    // Load time-based suggestions
    setTimeBasedRecs(recommendations.getTimeBasedSuggestions() || []);

    // Update listening streak
    dataStore.updateStreak();
  }, [currentTrack]);

  const handlePlayTrack = (track, queue) => {
    playTrack(track, queue);
    dataStore.addToHistory(track.id);
  };

  return (
    <div className="home-page animate-fade-in">
      {/* Hero Welcome */}
      <section className="home-hero">
        <div className="home-hero__content">
          <span className="home-hero__subtitle">Welcome Back</span>
          <h2 className="home-hero__title">{timeBasedRecs[0]?.reason || 'Ready for some music?'}</h2>
          <p className="home-hero__desc">Discover personalized mixes and fresh releases hand-picked for you.</p>
          <div className="home-hero__actions">
            {timeBasedRecs.length > 0 && (
              <button 
                className="btn btn-primary"
                onClick={() => handlePlayTrack(timeBasedRecs[0], timeBasedRecs)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Listen Now
              </button>
            )}
            <Link href="/mood" className="btn btn-secondary">
              Generate Mood Mix
            </Link>
          </div>
        </div>
        <div className="home-hero__visual">
          <div className="hero-orb hero-orb--1"></div>
          <div className="hero-orb hero-orb--2"></div>
        </div>
      </section>

      {/* Time-Based Recommendations */}
      {timeBasedRecs.length > 0 && (
        <section className="home-section">
          <h3 className="home-section__title">Time-of-Day Soundtrack</h3>
          <div className="carousel">
            {timeBasedRecs.map((track) => (
              <div key={track.id} className="card-hover home-track-card" onClick={() => handlePlayTrack(track, timeBasedRecs)}>
                <div className="home-track-card__art">
                  <img src={track.cover} alt={track.title} />
                  <button className="card-play-btn" aria-label="Play">
                    {currentTrack?.id === track.id && isPlaying ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="home-track-card__info">
                  <span className="home-track-card__title text-ellipsis">{track.title}</span>
                  <span className="home-track-card__artist text-ellipsis">{track.artist}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section className="home-section">
          <h3 className="home-section__title">Recently Played</h3>
          <div className="home-grid-compact">
            {recentlyPlayed.map((track) => (
              <div key={track.id} className="home-compact-card" onClick={() => handlePlayTrack(track, recentlyPlayed)}>
                <img src={track.cover} alt={track.title} className="home-compact-card__img" />
                <div className="home-compact-card__info">
                  <span className="home-compact-card__title text-ellipsis">{track.title}</span>
                  <span className="home-compact-card__artist text-ellipsis">{track.artist}</span>
                </div>
                <button className="home-compact-card__play" aria-label="Play">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations For You */}
      {personalizedRecs.length > 0 && (
        <section className="home-section">
          <h3 className="home-section__title">AI Recommendations</h3>
          <div className="carousel">
            {personalizedRecs.map((track) => (
              <div key={track.id} className="card-hover home-track-card" onClick={() => handlePlayTrack(track, personalizedRecs)}>
                <div className="home-track-card__art">
                  <img src={track.cover} alt={track.title} />
                  <button className="card-play-btn" aria-label="Play">
                    {currentTrack?.id === track.id && isPlaying ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="home-track-card__info">
                  <span className="home-track-card__title text-ellipsis">{track.title}</span>
                  <span className="home-track-card__artist text-ellipsis">{track.artist}</span>
                  <span className="home-track-card__reason text-ellipsis">{track.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Playlists */}
      <section className="home-section">
        <h3 className="home-section__title">Featured Playlists</h3>
        <div className="carousel">
          {playlists.map((playlist) => (
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
      </section>

      {/* Featured Artists */}
      <section className="home-section">
        <h3 className="home-section__title">Popular Artists</h3>
        <div className="carousel">
          {artists.map((artist) => (
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
      </section>

      {/* New Album Releases */}
      <section className="home-section">
        <h3 className="home-section__title">New Album Releases</h3>
        <div className="carousel">
          {albums.map((album) => (
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
      </section>
    </div>
  );
}
