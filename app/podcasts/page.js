'use client';

import { useState, useEffect } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { podcasts, podcastEpisodes } from '@/data/podcasts';
import { dataStore } from '@/lib/dataStore';

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PodcastsPage() {
  const { playTrack, state, setPlaybackRate } = usePlayer();
  const { currentTrack, isPlaying, playbackRate } = state || {};

  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [playingEpisodeId, setPlayingEpisodeId] = useState(null);

  useEffect(() => {
    if (selectedPodcast) {
      const pEp = podcastEpisodes.filter((ep) => ep.podcastId === selectedPodcast.id);
      setEpisodes(pEp);
    }
  }, [selectedPodcast]);

  const handlePlayEpisode = (episode) => {
    // Map episode to a pseudo track structure for the audio engine
    const trackEpisode = {
      id: episode.id,
      title: episode.title,
      artist: selectedPodcast.host,
      album: selectedPodcast.title,
      cover: selectedPodcast.cover,
      audioSrc: '/audio/track1.mp3', // Map to dummy track MP3
      duration: episode.duration,
      genre: 'Podcast',
      plays: 0
    };

    playTrack(trackEpisode, [trackEpisode]);
    setPlayingEpisodeId(episode.id);
  };

  const handleSkipTime = (seconds) => {
    const playerEl = document.querySelector('audio');
    if (playerEl) {
      playerEl.currentTime = Math.max(0, Math.min(playerEl.duration, playerEl.currentTime + seconds));
    }
  };

  const handleSpeedChange = (e) => {
    const rate = parseFloat(e.target.value);
    setPlaybackRate(rate);
  };

  return (
    <div className="podcasts-page animate-fade-in">
      <div className="podcasts-hero glass">
        <h2>Sonicwave Podcasts</h2>
        <p>Listen to insights, technology, production guides, and discussions from popular creators.</p>
      </div>

      <div className="podcasts-grid-layout">
        {/* Left: Podcast list */}
        <div className="podcasts-sidebar">
          <h3 className="search-heading">Shows</h3>
          <div className="podcasts-list">
            {podcasts.map((podcast) => (
              <div
                key={podcast.id}
                className={`podcast-row-card glass-hover ${selectedPodcast?.id === podcast.id ? 'podcast-row-card--active' : ''}`}
                onClick={() => setSelectedPodcast(podcast)}
              >
                <img src={podcast.cover} alt={podcast.title} />
                <div className="podcast-row-card__info">
                  <span className="podcast-row-card__title text-ellipsis">{podcast.title}</span>
                  <span className="podcast-row-card__host text-ellipsis">By {podcast.host}</span>
                  <span className="badge podcast-row-card__category">{podcast.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Podcast Episodes */}
        <div className="podcasts-content">
          {selectedPodcast ? (
            <div className="podcast-detail animate-fade-in-up">
              <div className="podcast-detail__header flex-gap-md">
                <img src={selectedPodcast.cover} alt={selectedPodcast.title} />
                <div>
                  <span className="badge">{selectedPodcast.category}</span>
                  <h3>{selectedPodcast.title}</h3>
                  <p className="podcast-detail__host">Hosted by {selectedPodcast.host}</p>
                  <p className="podcast-detail__desc">{selectedPodcast.description}</p>
                </div>
              </div>

              {/* Speed & Control adjustments */}
              {playingEpisodeId && currentTrack?.album === selectedPodcast.title && (
                <div className="podcast-player-bar glass flex-between">
                  <div className="flex-gap-sm flex-center">
                    <span className="podcast-player-bar__title text-ellipsis">Listening to: {currentTrack?.title}</span>
                  </div>
                  <div className="flex-gap-sm flex-center">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleSkipTime(-15)}>
                      -15s
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleSkipTime(15)}>
                      +15s
                    </button>
                    <select
                      className="podcast-speed-select"
                      value={playbackRate || 1}
                      onChange={handleSpeedChange}
                      aria-label="Playback speed"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="1">1.0x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2.0x</option>
                    </select>
                  </div>
                </div>
              )}

              <h4 className="search-heading" style={{ marginTop: '24px' }}>All Episodes</h4>
              <div className="episodes-list">
                {episodes.map((episode) => {
                  const isPlayingEp = playingEpisodeId === episode.id && currentTrack?.id === episode.id && isPlaying;
                  return (
                    <div key={episode.id} className="episode-card glass">
                      <div className="episode-card__header flex-between">
                        <div>
                          <h5 className="episode-card__title">{episode.title}</h5>
                          <span className="episode-card__date">{episode.date} • {formatDuration(episode.duration)} mins</span>
                        </div>
                        <button className="btn-icon episode-card__play" onClick={() => handlePlayEpisode(episode)} aria-label="Play">
                          {isPlayingEp ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="episode-card__desc">{episode.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="podcast-empty flex-center" style={{ height: '300px' }}>
              <p>Select a podcast show from the sidebar to view episodes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
