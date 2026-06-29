'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tracks } from '@/data/tracks';
import { artists } from '@/data/artists';
import { dataStore } from '@/lib/dataStore';

export default function StatsPage() {
  const [streak, setStreak] = useState({ current: 0 });
  const [totalListeningTime, setTotalListeningTime] = useState(0);
  const [topTracks, setTopTracks] = useState([]);
  const [topGenres, setTopGenres] = useState([]);
  const [topArtist, setTopArtist] = useState(null);

  useEffect(() => {
    // 1. Get streak
    const userStreak = dataStore.getStreak();
    setStreak(userStreak);

    // 2. Total time
    const time = dataStore.getTotalListeningTime() || 3450; // default mockup listening time if new user
    setTotalListeningTime(time);

    // 3. Top Tracks (from dataStore play counts)
    const counts = dataStore.getPlayCounts();
    let sortedTracks = [];
    if (Object.keys(counts).length > 0) {
      sortedTracks = Object.entries(counts)
        .map(([id, plays]) => {
          const track = tracks.find((t) => t.id === id);
          return track ? { ...track, plays: plays + (track.plays || 0) } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.plays - a.plays);
    } else {
      // Fallback/Mock top tracks
      sortedTracks = [...tracks].sort((a, b) => b.plays - a.plays).slice(0, 5);
    }
    setTopTracks(sortedTracks.slice(0, 5));

    // 4. Top Genres
    const genreStats = dataStore.getGenreStats();
    let genresSorted = [];
    if (Object.keys(genreStats).length > 0) {
      genresSorted = Object.entries(genreStats)
        .map(([genre, sec]) => ({ name: genre, time: sec }))
        .sort((a, b) => b.time - a.time);
    } else {
      // Fallback
      genresSorted = [
        { name: 'Electronic', time: 1800 },
        { name: 'Synthwave', time: 1200 },
        { name: 'Indie Folk', time: 900 },
        { name: 'Rock', time: 600 }
      ];
    }
    setTopGenres(genresSorted);

    // 5. Top Artist
    const artistStats = dataStore.getArtistStats();
    let bestArtist = null;
    if (Object.keys(artistStats).length > 0) {
      const topArtistId = Object.entries(artistStats).sort((a, b) => b[1] - a[1])[0][0];
      bestArtist = artists.find((a) => a.id === topArtistId);
    } else {
      bestArtist = artists[0];
    }
    setTopArtist(bestArtist);
  }, []);

  const totalMin = Math.round(totalListeningTime / 60);

  return (
    <div className="stats-page animate-fade-in">
      <div className="stats-hero glass">
        <h2>Your Listening Profile</h2>
        <p>Insights, statistics, and musical preferences generated directly from your listening history.</p>
      </div>

      {/* Grid of stats */}
      <div className="stats-dashboard-grid">
        {/* Streak card */}
        <div className="stat-card glass flex-center flex-column">
          <span className="stat-card__emoji">🔥</span>
          <h4 className="stat-card__title">Listening Streak</h4>
          <span className="stat-card__number">{streak.current || 1} Days</span>
          <p className="stat-card__desc">Keep listening daily to grow your streak!</p>
        </div>

        {/* Listening Time */}
        <div className="stat-card glass flex-center flex-column">
          <span className="stat-card__emoji">⏱️</span>
          <h4 className="stat-card__title">Total Time</h4>
          <span className="stat-card__number">{totalMin} Mins</span>
          <p className="stat-card__desc">Total minutes of track playback recorded.</p>
        </div>

        {/* Top Artist */}
        {topArtist && (
          <div className="stat-card glass flex-center flex-column">
            <img src={topArtist.image} alt={topArtist.name} className="stat-card__avatar" />
            <h4 className="stat-card__title">Top Artist</h4>
            <span className="stat-card__number">{topArtist.name}</span>
            <p className="stat-card__desc">Your most-played artist this week.</p>
          </div>
        )}
      </div>

      <div className="stats-charts-section">
        {/* Top tracks list */}
        <div className="stats-chart-card glass">
          <h3 className="search-heading">Top Tracks</h3>
          <div className="stats-track-list">
            {topTracks.map((track, i) => (
              <div key={track.id} className="stats-track-row flex-between">
                <div className="flex-gap-sm flex-center">
                  <span className="stats-track-index">{i + 1}</span>
                  <img src={track.cover} alt={track.title} />
                  <div className="stats-track-info">
                    <span className="stats-track-title text-ellipsis">{track.title}</span>
                    <span className="stats-track-artist text-ellipsis">{track.artist}</span>
                  </div>
                </div>
                <span className="stats-track-plays">{(track.plays || 0).toLocaleString()} plays</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Genres bar chart */}
        <div className="stats-chart-card glass">
          <h3 className="search-heading">Top Genres</h3>
          <div className="genres-chart">
            {topGenres.map((genre) => {
              const maxTime = Math.max(...topGenres.map((g) => g.time));
              const percent = maxTime > 0 ? (genre.time / maxTime) * 100 : 0;
              return (
                <div key={genre.name} className="genre-bar-container">
                  <div className="flex-between">
                    <span className="genre-bar-name">{genre.name}</span>
                    <span className="genre-bar-time">{Math.round(genre.time / 60)} min</span>
                  </div>
                  <div className="genre-bar-bg">
                    <div 
                      className="genre-bar-fill"
                      style={{ 
                        width: `${percent}%`,
                        background: genre.name === 'Electronic' ? 'var(--accent-purple)' :
                                    genre.name === 'Synthwave' ? 'var(--accent-pink)' :
                                    genre.name === 'Indie Folk' ? 'var(--accent-green)' : 'var(--accent-blue)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
