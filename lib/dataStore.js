/**
 * dataStore – localStorage persistence layer for Sonicwave.
 *
 * Every public method guards against SSR with a `typeof window` check
 * and returns safe defaults so server-rendered pages never crash.
 */

const STORAGE_KEYS = {
  LIKED_TRACKS: 'sonicwave_liked_tracks',
  USER_PLAYLISTS: 'sonicwave_user_playlists',
  LISTENING_HISTORY: 'sonicwave_listening_history',
  PLAY_COUNTS: 'sonicwave_play_counts',
  GENRE_TIME: 'sonicwave_genre_time',
  ARTIST_TIME: 'sonicwave_artist_time',
  STREAK: 'sonicwave_streak',
  PODCAST_PROGRESS: 'sonicwave_podcast_progress',
  SETTINGS: 'sonicwave_settings',
};

/* ====================================================================== */
/*  Internal helpers                                                       */
/* ====================================================================== */

function isBrowser() {
  return typeof window !== 'undefined';
}

function read(key, fallback = null) {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full / private mode – silently fail
  }
}

function generateId() {
  return `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/* ====================================================================== */
/*  Public API                                                             */
/* ====================================================================== */

export const dataStore = {
  /* ------------------------------------------------------------------ */
  /*  Liked tracks                                                       */
  /* ------------------------------------------------------------------ */

  getLikedTracks() {
    const arr = read(STORAGE_KEYS.LIKED_TRACKS, []);
    return new Set(arr);
  },

  toggleLike(trackId) {
    const liked = this.getLikedTracks();
    let newState;
    if (liked.has(trackId)) {
      liked.delete(trackId);
      newState = false;
    } else {
      liked.add(trackId);
      newState = true;
    }
    write(STORAGE_KEYS.LIKED_TRACKS, [...liked]);
    return newState;
  },

  isLiked(trackId) {
    return this.getLikedTracks().has(trackId);
  },

  /* ------------------------------------------------------------------ */
  /*  User playlists                                                     */
  /* ------------------------------------------------------------------ */

  getUserPlaylists() {
    return read(STORAGE_KEYS.USER_PLAYLISTS, []);
  },

  createPlaylist(name, description = '') {
    const playlists = this.getUserPlaylists();
    const newPlaylist = {
      id: generateId(),
      name,
      description,
      trackIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    playlists.push(newPlaylist);
    write(STORAGE_KEYS.USER_PLAYLISTS, playlists);
    return newPlaylist;
  },

  addTrackToPlaylist(playlistId, trackId) {
    const playlists = this.getUserPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return false;
    if (playlist.trackIds.includes(trackId)) return false;
    playlist.trackIds.push(trackId);
    playlist.updatedAt = new Date().toISOString();
    write(STORAGE_KEYS.USER_PLAYLISTS, playlists);
    return true;
  },

  removeTrackFromPlaylist(playlistId, trackId) {
    const playlists = this.getUserPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return false;
    playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
    playlist.updatedAt = new Date().toISOString();
    write(STORAGE_KEYS.USER_PLAYLISTS, playlists);
    return true;
  },

  deletePlaylist(playlistId) {
    const playlists = this.getUserPlaylists().filter((p) => p.id !== playlistId);
    write(STORAGE_KEYS.USER_PLAYLISTS, playlists);
    return true;
  },

  /* ------------------------------------------------------------------ */
  /*  Listening history                                                  */
  /* ------------------------------------------------------------------ */

  addToHistory(trackId) {
    const history = read(STORAGE_KEYS.LISTENING_HISTORY, []);
    history.push({ trackId, timestamp: Date.now() });
    // Keep last 500 entries
    const trimmed = history.slice(-500);
    write(STORAGE_KEYS.LISTENING_HISTORY, trimmed);
  },

  getHistory() {
    return read(STORAGE_KEYS.LISTENING_HISTORY, []);
  },

  getRecentlyPlayed(limit = 10) {
    const history = this.getHistory();
    // Walk backwards, collecting unique track IDs
    const seen = new Set();
    const result = [];
    for (let i = history.length - 1; i >= 0 && result.length < limit; i--) {
      const { trackId } = history[i];
      if (!seen.has(trackId)) {
        seen.add(trackId);
        result.push(trackId);
      }
    }
    return result;
  },

  /* ------------------------------------------------------------------ */
  /*  Play counts & listening-time stats                                 */
  /* ------------------------------------------------------------------ */

  incrementPlayCount(trackId) {
    const counts = read(STORAGE_KEYS.PLAY_COUNTS, {});
    counts[trackId] = (counts[trackId] || 0) + 1;
    write(STORAGE_KEYS.PLAY_COUNTS, counts);
    return counts[trackId];
  },

  getPlayCounts() {
    return read(STORAGE_KEYS.PLAY_COUNTS, {});
  },

  /**
   * Record listening time for genre & artist stats.
   * @param {string} genre
   * @param {string} artistId
   * @param {number} seconds
   */
  addListeningTime(genre, artistId, seconds) {
    if (!genre || !artistId || seconds <= 0) return;

    const genreStats = read(STORAGE_KEYS.GENRE_TIME, {});
    genreStats[genre] = (genreStats[genre] || 0) + seconds;
    write(STORAGE_KEYS.GENRE_TIME, genreStats);

    const artistStats = read(STORAGE_KEYS.ARTIST_TIME, {});
    artistStats[artistId] = (artistStats[artistId] || 0) + seconds;
    write(STORAGE_KEYS.ARTIST_TIME, artistStats);
  },

  getGenreStats() {
    return read(STORAGE_KEYS.GENRE_TIME, {});
  },

  getArtistStats() {
    return read(STORAGE_KEYS.ARTIST_TIME, {});
  },

  getTotalListeningTime() {
    const genreStats = this.getGenreStats();
    return Object.values(genreStats).reduce((sum, s) => sum + s, 0);
  },

  /* ------------------------------------------------------------------ */
  /*  Listening streak                                                   */
  /* ------------------------------------------------------------------ */

  updateStreak() {
    const streak = read(STORAGE_KEYS.STREAK, { current: 0, lastDate: null });
    const today = todayStr();

    if (streak.lastDate === today) {
      // Already counted today
      return streak;
    }

    // Check if yesterday was the last listen date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (streak.lastDate === yesterdayStr) {
      streak.current += 1;
    } else {
      // Streak broken — reset to 1 (today counts)
      streak.current = 1;
    }
    streak.lastDate = today;
    write(STORAGE_KEYS.STREAK, streak);
    return streak;
  },

  getStreak() {
    return read(STORAGE_KEYS.STREAK, { current: 0, lastDate: null });
  },

  /* ------------------------------------------------------------------ */
  /*  Podcast progress                                                   */
  /* ------------------------------------------------------------------ */

  savePodcastProgress(episodeId, seconds) {
    const progress = read(STORAGE_KEYS.PODCAST_PROGRESS, {});
    progress[episodeId] = {
      ...(progress[episodeId] || {}),
      position: seconds,
      updatedAt: Date.now(),
    };
    write(STORAGE_KEYS.PODCAST_PROGRESS, progress);
  },

  getPodcastProgress(episodeId) {
    const progress = read(STORAGE_KEYS.PODCAST_PROGRESS, {});
    return progress[episodeId]?.position || 0;
  },

  markEpisodePlayed(episodeId) {
    const progress = read(STORAGE_KEYS.PODCAST_PROGRESS, {});
    progress[episodeId] = {
      ...(progress[episodeId] || {}),
      played: true,
      updatedAt: Date.now(),
    };
    write(STORAGE_KEYS.PODCAST_PROGRESS, progress);
  },

  isEpisodePlayed(episodeId) {
    const progress = read(STORAGE_KEYS.PODCAST_PROGRESS, {});
    return progress[episodeId]?.played === true;
  },

  /* ------------------------------------------------------------------ */
  /*  Settings                                                           */
  /* ------------------------------------------------------------------ */

  saveSettings(settings) {
    const current = this.getSettings();
    write(STORAGE_KEYS.SETTINGS, { ...current, ...settings });
  },

  getSettings() {
    return read(STORAGE_KEYS.SETTINGS, {
      theme: 'dark',
      quality: 'high',
      crossfade: 0,
      showNotifications: true,
      language: 'en',
    });
  },
};
