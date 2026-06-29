/**
 * Sonicwave Recommendation Engine
 *
 * Generates personalised track suggestions using genre similarity,
 * mood-tag overlap, BPM proximity, and listening-history weighting.
 * Every returned item carries a human-readable `reason` string.
 */

import { tracks } from '@/data/tracks';
import { dataStore } from '@/lib/dataStore';

/* ====================================================================== */
/*  Internal scoring helpers                                               */
/* ====================================================================== */

/** Genre-family map – genres in the same family score higher similarity. */
const GENRE_FAMILIES = {
  electronic: ['Electronic', 'EDM', 'Dance', 'Future Bass', 'Ambient'],
  synth: ['Synthwave', 'Retrowave', 'Electronic'],
  acoustic: ['Acoustic', 'Indie Folk', 'Folk'],
  chill: ['Chill', 'Ambient', 'Dream Pop'],
  rock: ['Alternative Rock', 'Rock', 'Indie'],
  hiphop: ['Hip-Hop', 'R&B', 'Urban'],
};

function genreSimilarity(g1, g2) {
  if (g1 === g2) return 1;
  for (const family of Object.values(GENRE_FAMILIES)) {
    if (family.includes(g1) && family.includes(g2)) return 0.7;
  }
  return 0.1;
}

function moodOverlap(moods1 = [], moods2 = []) {
  const set1 = new Set(moods1);
  let overlap = 0;
  for (const m of moods2) {
    if (set1.has(m)) overlap++;
  }
  const total = new Set([...moods1, ...moods2]).size || 1;
  return overlap / total;
}

function bpmProximity(bpm1, bpm2) {
  const diff = Math.abs(bpm1 - bpm2);
  if (diff <= 5) return 1;
  if (diff <= 15) return 0.7;
  if (diff <= 30) return 0.4;
  return 0.1;
}

/**
 * Score how similar trackB is to trackA.
 * Returns a number between 0 and 1.
 */
function similarityScore(trackA, trackB) {
  if (trackA.id === trackB.id) return 0; // never recommend itself
  const genre = genreSimilarity(trackA.genre, trackB.genre) * 0.4;
  const mood = moodOverlap(trackA.mood, trackB.mood) * 0.35;
  const bpm = bpmProximity(trackA.bpm, trackB.bpm) * 0.25;
  return genre + mood + bpm;
}

/** Return the hour-of-day bracket. */
function getTimePeriod() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/** Mood tags that fit each time period. */
const TIME_MOODS = {
  morning: ['calm', 'happy', 'morning', 'warm', 'peaceful'],
  afternoon: ['focus', 'energetic', 'uplifting', 'driving'],
  evening: ['chill', 'romantic', 'nostalgic', 'golden'],
  night: ['dreamy', 'night', 'atmospheric', 'dark', 'neon'],
};

function shuffleSlice(arr, limit) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, limit);
}

/* ====================================================================== */
/*  Public API                                                             */
/* ====================================================================== */

export const recommendations = {
  /**
   * Personalised picks based on listening history, liked tracks,
   * and favourite genres.
   */
  getPersonalized(limit = 6) {
    const likedSet = dataStore.getLikedTracks();
    const genreStats = dataStore.getGenreStats();
    const recentIds = dataStore.getRecentlyPlayed(20);
    const recentSet = new Set(recentIds);

    // Determine top genre
    let topGenre = null;
    let maxTime = 0;
    for (const [genre, time] of Object.entries(genreStats)) {
      if (time > maxTime) {
        maxTime = time;
        topGenre = genre;
      }
    }

    // Score each track
    const scored = tracks.map((track) => {
      let score = 0;

      // Boost tracks in the user's top genre
      if (topGenre && genreSimilarity(track.genre, topGenre) > 0.5) {
        score += 3;
      }

      // Boost tracks similar to liked tracks
      for (const likedId of likedSet) {
        const likedTrack = tracks.find((t) => t.id === likedId);
        if (likedTrack) score += similarityScore(likedTrack, track) * 2;
      }

      // Small novelty boost if not recently played
      if (!recentSet.has(track.id)) {
        score += 0.5;
      }

      // Small popularity boost
      score += (track.plays / 10000000) * 0.3;

      return { track, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(({ track }) => {
      let reason = 'Recommended for you';
      if (topGenre && genreSimilarity(track.genre, topGenre) > 0.5) {
        reason = `Because you listen to ${topGenre}`;
      } else if (likedSet.size > 0) {
        reason = 'Based on your liked tracks';
      }
      return { ...track, reason };
    });
  },

  /**
   * Find tracks similar to a specific track.
   */
  getSimilarTracks(trackId, limit = 5) {
    const target = tracks.find((t) => t.id === trackId);
    if (!target) return [];

    const scored = tracks
      .filter((t) => t.id !== trackId)
      .map((track) => ({
        track,
        score: similarityScore(target, track),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(({ track }) => ({
      ...track,
      reason: `Similar to "${target.title}"`,
    }));
  },

  /**
   * Filter tracks by mood tag.
   */
  getForMood(mood, limit = 8) {
    const matching = tracks.filter((t) =>
      t.mood.some((m) => m.toLowerCase() === mood.toLowerCase())
    );

    return shuffleSlice(matching, limit).map((track) => ({
      ...track,
      reason: `Matches ${mood} mood`,
    }));
  },

  /**
   * "Discover Weekly" — tracks the user hasn't listened to much.
   */
  getDiscoverWeekly(limit = 8) {
    const playCounts = dataStore.getPlayCounts();
    const recentIds = new Set(dataStore.getRecentlyPlayed(30));

    const candidates = tracks.filter((t) => {
      const count = playCounts[t.id] || 0;
      return count < 3 && !recentIds.has(t.id);
    });

    if (candidates.length === 0) {
      // Fall back to least-played tracks
      const sorted = [...tracks].sort(
        (a, b) => (playCounts[a.id] || 0) - (playCounts[b.id] || 0)
      );
      return sorted.slice(0, limit).map((track) => ({
        ...track,
        reason: 'Discover something new',
      }));
    }

    return shuffleSlice(candidates, limit).map((track) => ({
      ...track,
      reason: 'Discover something new',
    }));
  },

  /**
   * "Because you listened to [track]" — similar tracks with a specific reason.
   */
  getBecauseYouListened(trackId, limit = 4) {
    const target = tracks.find((t) => t.id === trackId);
    if (!target) return [];

    const scored = tracks
      .filter((t) => t.id !== trackId)
      .map((track) => ({
        track,
        score: similarityScore(target, track),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(({ track }) => {
      // Generate a specific reason
      let reason;
      if (track.genre === target.genre) {
        reason = `Because you listened to "${target.title}"`;
      } else if (moodOverlap(track.mood, target.mood) > 0.3) {
        const sharedMood = track.mood.find((m) => target.mood.includes(m)) || track.mood[0];
        reason = `Shares the ${sharedMood} vibe of "${target.title}"`;
      } else {
        reason = `Fans of "${target.artist}" also enjoy this`;
      }
      return { ...track, reason };
    });
  },

  /**
   * Time-of-day suggestions.
   * Morning → calm/peaceful, Afternoon → focus/energetic,
   * Evening → chill/romantic, Night → dreamy/atmospheric.
   */
  getTimeBasedSuggestions(limit = 6) {
    const period = getTimePeriod();
    const targetMoods = TIME_MOODS[period];

    const scored = tracks.map((track) => {
      const overlap = track.mood.filter((m) => targetMoods.includes(m)).length;
      return { track, score: overlap };
    });

    scored.sort((a, b) => b.score - a.score);

    const periodLabels = {
      morning: 'Perfect for your morning',
      afternoon: 'Afternoon focus music',
      evening: 'Evening wind-down',
      night: 'Late night listening',
    };

    return scored.slice(0, limit).map(({ track }) => ({
      ...track,
      reason: periodLabels[period],
    }));
  },
};
