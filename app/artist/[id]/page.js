'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlayer } from '@/contexts/PlayerContext';
import { artists } from '@/data/artists';
import { tracks } from '@/data/tracks';
import { albums } from '@/data/albums';

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatListeners(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
  return num;
}

export default function ArtistDetail({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { playTrack, state } = usePlayer();
  const { currentTrack, isPlaying } = state || {};

  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [artistAlbums, setArtistAlbums] = useState([]);

  useEffect(() => {
    const foundArtist = artists.find((a) => a.id === params.id);
    if (foundArtist) {
      setArtist(foundArtist);
      
      const aTracks = foundArtist.topTrackIds
        .map((tid) => tracks.find((t) => t.id === tid))
        .filter(Boolean);
      setTopTracks(aTracks);

      const aAlbums = albums.filter((al) => al.artistId === foundArtist.id);
      setArtistAlbums(aAlbums);
    }
  }, [params.id]);

  const handlePlayTrack = (track) => {
    playTrack(track, topTracks);
  };

  const handlePlayAll = () => {
    if (topTracks.length > 0) {
      playTrack(topTracks[0], topTracks);
    }
  };

  if (!artist) {
    return (
      <div className="artist-detail animate-fade-in flex-center" style={{ height: '50vh' }}>
        <p>Artist not found</p>
      </div>
    );
  }

  return (
    <div className="artist-detail animate-fade-in">
      {/* Hero Banner */}
      <div
        className="artist-detail__banner"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(10, 10, 15, 0.4) 0%, var(--bg-primary) 100%), url(${artist.image})`
        }}
      >
        <div className="artist-detail__banner-content">
          {artist.verified && (
            <span className="artist-detail__verified-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Verified Artist
            </span>
          )}
          <h2 className="artist-detail__name">{artist.name}</h2>
          <span className="artist-detail__listeners">
            {formatListeners(artist.monthlyListeners)} monthly listeners
          </span>
        </div>
      </div>

      {/* Action Area */}
      <div className="playlist-detail__actions">
        <button className="btn btn-primary btn-lg" onClick={handlePlayAll} disabled={topTracks.length === 0}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Play
        </button>
        <div className="artist-detail__genres">
          {artist.genres.map((genre) => (
            <span key={genre} className="badge">
              {genre}
            </span>
          ))}
        </div>
      </div>

      {/* Top Tracks */}
      <div className="artist-detail__content-grid">
        <div className="artist-detail__top-tracks">
          <h3 className="search-heading">Popular</h3>
          <div className="track-list">
            {topTracks.map((track, i) => {
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
        </div>

        {/* Bio Card */}
        <div className="artist-detail__bio-card glass">
          <h3 className="search-heading">About</h3>
          <p className="artist-detail__bio-text">{artist.bio}</p>
        </div>
      </div>

      {/* Albums Discography */}
      {artistAlbums.length > 0 && (
        <div className="artist-detail__albums-section">
          <h3 className="search-heading">Albums</h3>
          <div className="carousel">
            {artistAlbums.map((album) => (
              <Link key={album.id} href={`/album/${album.id}`} className="card-hover home-track-card">
                <div className="home-track-card__art">
                  <img src={album.cover} alt={album.title} />
                </div>
                <div className="home-track-card__info">
                  <span className="home-track-card__title text-ellipsis">{album.title}</span>
                  <span className="home-track-card__artist text-ellipsis">{album.year} • Album</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
