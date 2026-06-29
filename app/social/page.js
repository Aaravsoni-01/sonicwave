'use client';

import { useState } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { playlists } from '@/data/playlists';

const FRIEND_ACTIVITIES = [
  { id: 1, name: 'Alice Chen', avatarColor: '#7c3aed', initial: 'A', status: 'online', track: 'Midnight Dreams', artist: 'Luna Vale', time: '2m ago' },
  { id: 2, name: 'Sarah Miller', avatarColor: '#ec4899', initial: 'S', status: 'online', track: 'Concrete Roses', artist: 'Kai Storm', time: '12m ago' },
  { id: 3, name: 'David K.', avatarColor: '#3b82f6', initial: 'D', status: 'offline', track: 'Whispers in the Pines', artist: 'Echo Rivers', time: '2h ago' },
  { id: 4, name: 'Emma Watson', avatarColor: '#1DB954', initial: 'E', status: 'online', track: 'Pulse Override', artist: 'Neon Drift', time: 'Just Now' },
  { id: 5, name: 'Michael Brown', avatarColor: '#f97316', initial: 'M', status: 'offline', track: 'Supernova Heart', artist: 'Kai Storm', time: '1d ago' },
];

export default function SocialPage() {
  const { state } = usePlayer();
  const { currentTrack } = state || {};
  
  const [copied, setCopied] = useState(false);
  const [sharesCount, setSharesCount] = useState(14);

  const handleCopyLink = () => {
    if (!currentTrack) return;
    navigator.clipboard.writeText(`${window.location.origin}/album/${currentTrack.albumId}`);
    setCopied(true);
    setSharesCount((c) => c + 1);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="social-page animate-fade-in">
      <div className="social-hero glass">
        <h2>Sonicwave Social Hub</h2>
        <p>See what your friends are listening to, share your favorite albums, and broadcast public mixes.</p>
      </div>

      <div className="social-layout-grid">
        {/* Left: Friend Activity Feed */}
        <div className="social-main-feed glass">
          <h3 className="search-heading">Friend Activity</h3>
          <div className="friend-activities-list">
            {FRIEND_ACTIVITIES.map((activity) => (
              <div key={activity.id} className="friend-activity-row flex-between">
                <div className="flex-gap-md flex-center">
                  <div className="friend-avatar-container">
                    <div 
                      className="friend-avatar"
                      style={{ backgroundColor: activity.avatarColor }}
                    >
                      {activity.initial}
                    </div>
                    <span className={`status-dot status-dot--${activity.status}`} />
                  </div>
                  <div className="friend-activity-text">
                    <span className="friend-activity-name">{activity.name}</span>
                    <p className="friend-activity-desc text-clamp-2">
                      Listening to <span className="friend-activity-song">{activity.track}</span> by {activity.artist}
                    </p>
                  </div>
                </div>
                <span className="friend-activity-time">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sharing & Broadcast */}
        <div className="social-side-panel flex-column flex-gap-lg">
          {/* Share Current Track */}
          <div className="social-panel-card glass flex-column">
            <h4 className="search-heading">Share Track</h4>
            {currentTrack ? (
              <div className="share-track-card flex-column">
                <img src={currentTrack.cover} alt={currentTrack.title} className="share-track-card__img" />
                <span className="share-track-card__title text-ellipsis">{currentTrack.title}</span>
                <span className="share-track-card__artist text-ellipsis">{currentTrack.artist}</span>
                
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleCopyLink}>
                  {copied ? 'Copied ✓' : 'Copy Share Link'}
                </button>
              </div>
            ) : (
              <p className="social-panel-empty">Play a song to share it with your friends.</p>
            )}
          </div>

          {/* Social Stats */}
          <div className="social-panel-card glass flex-between">
            <div>
              <h4 className="search-heading">Social Score</h4>
              <p className="social-panel-desc">Based on shares and interaction</p>
            </div>
            <div className="social-score-badge">
              <span className="social-score-value">{sharesCount}</span>
              <span className="social-score-label">Shares</span>
            </div>
          </div>

          {/* Public Playlists */}
          <div className="social-panel-card glass flex-column">
            <h4 className="search-heading">Your Shared Playlists</h4>
            <div className="shared-playlists-list">
              {playlists.slice(0, 3).map((pl) => (
                <div key={pl.id} className="shared-playlist-row flex-between">
                  <div className="flex-gap-sm flex-center">
                    <img src={pl.cover} alt={pl.name} className="shared-playlist-img" />
                    <span className="shared-playlist-name text-ellipsis">{pl.name}</span>
                  </div>
                  <span className="badge">Public</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
