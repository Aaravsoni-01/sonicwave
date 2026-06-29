'use client';

import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { AudioEngine } from '@/lib/audioEngine';
import { tracks as allTracks } from '@/data/tracks';

/* ====================================================================== */
/*  Initial state                                                          */
/* ====================================================================== */

const initialState = {
  currentTrack: null,
  queue: [],
  playHistory: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isMuted: false,
  shuffle: false,
  repeat: 'off', // 'off' | 'all' | 'one'
  sleepTimer: null, // { remaining: seconds } | null
  playbackRate: 1,
  showQueue: false,
  showLyrics: false,
};

/* ====================================================================== */
/*  Action types                                                           */
/* ====================================================================== */

const ActionTypes = {
  PLAY_TRACK: 'PLAY_TRACK',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  NEXT_TRACK: 'NEXT_TRACK',
  PREV_TRACK: 'PREV_TRACK',
  SEEK: 'SEEK',
  SET_VOLUME: 'SET_VOLUME',
  TOGGLE_MUTE: 'TOGGLE_MUTE',
  TOGGLE_SHUFFLE: 'TOGGLE_SHUFFLE',
  CYCLE_REPEAT: 'CYCLE_REPEAT',
  SET_QUEUE: 'SET_QUEUE',
  ADD_TO_QUEUE: 'ADD_TO_QUEUE',
  REMOVE_FROM_QUEUE: 'REMOVE_FROM_QUEUE',
  UPDATE_TIME: 'UPDATE_TIME',
  SET_DURATION: 'SET_DURATION',
  SET_SLEEP_TIMER: 'SET_SLEEP_TIMER',
  CANCEL_SLEEP_TIMER: 'CANCEL_SLEEP_TIMER',
  SET_PLAYBACK_RATE: 'SET_PLAYBACK_RATE',
  TOGGLE_QUEUE: 'TOGGLE_QUEUE',
  TOGGLE_LYRICS: 'TOGGLE_LYRICS',
  PLAY_ALBUM: 'PLAY_ALBUM',
  PLAY_PLAYLIST: 'PLAY_PLAYLIST',
};

/* ====================================================================== */
/*  Helpers                                                                */
/* ====================================================================== */

function resolveTrack(idOrTrack) {
  if (!idOrTrack) return null;
  if (typeof idOrTrack === 'object') return idOrTrack;
  return allTracks.find((t) => t.id === idOrTrack) || null;
}

function resolveTrackList(ids) {
  if (!ids || !Array.isArray(ids)) return [];
  return ids.map(resolveTrack).filter(Boolean);
}

/** Fisher-Yates shuffle (returns new array) */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Compute the next track based on repeat / shuffle / queue state. */
function getNextTrack(state) {
  const { currentTrack, queue, repeat, shuffle } = state;
  if (!currentTrack || queue.length === 0) return null;

  if (repeat === 'one') return currentTrack;

  const idx = queue.findIndex((t) => t.id === currentTrack.id);

  if (shuffle) {
    // Pick a random track that isn't the current one (unless queue has only 1)
    if (queue.length === 1) return queue[0];
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * queue.length);
    } while (nextIdx === idx);
    return queue[nextIdx];
  }

  const nextIdx = idx + 1;
  if (nextIdx < queue.length) return queue[nextIdx];
  if (repeat === 'all') return queue[0];
  return null; // end of queue, no repeat
}

/** Compute the previous track. */
function getPrevTrack(state) {
  const { currentTrack, queue, playHistory } = state;
  if (!currentTrack) return null;

  // If we have play history with more than just the current track, go back
  if (playHistory.length > 1) {
    return playHistory[playHistory.length - 2]; // second-to-last
  }

  const idx = queue.findIndex((t) => t.id === currentTrack.id);
  if (idx > 0) return queue[idx - 1];
  if (state.repeat === 'all' && queue.length > 0) return queue[queue.length - 1];
  return currentTrack; // restart current track
}

/* ====================================================================== */
/*  Reducer                                                                */
/* ====================================================================== */

function playerReducer(state, action) {
  switch (action.type) {
    case ActionTypes.PLAY_TRACK: {
      const track = resolveTrack(action.payload.track);
      if (!track) return state;
      const queue = action.payload.queue
        ? resolveTrackList(action.payload.queue)
        : state.queue.length > 0
        ? state.queue
        : [track];
      // Make sure the played track is in the queue
      const inQueue = queue.some((t) => t.id === track.id);
      const finalQueue = inQueue ? queue : [track, ...queue];
      return {
        ...state,
        currentTrack: track,
        queue: finalQueue,
        isPlaying: true,
        currentTime: 0,
        playHistory: [...state.playHistory.slice(-49), track],
      };
    }

    case ActionTypes.PAUSE:
      return { ...state, isPlaying: false };

    case ActionTypes.RESUME:
      return { ...state, isPlaying: true };

    case ActionTypes.NEXT_TRACK: {
      const next = getNextTrack(state);
      if (!next) return { ...state, isPlaying: false };
      return {
        ...state,
        currentTrack: next,
        isPlaying: true,
        currentTime: 0,
        playHistory: [...state.playHistory.slice(-49), next],
      };
    }

    case ActionTypes.PREV_TRACK: {
      // If more than 3 seconds into the track, restart instead
      if (state.currentTime > 3) {
        return { ...state, currentTime: 0 };
      }
      const prev = getPrevTrack(state);
      return {
        ...state,
        currentTrack: prev || state.currentTrack,
        isPlaying: true,
        currentTime: 0,
        playHistory: prev
          ? [...state.playHistory.slice(-49), prev]
          : state.playHistory,
      };
    }

    case ActionTypes.SEEK:
      return { ...state, currentTime: action.payload };

    case ActionTypes.SET_VOLUME:
      return { ...state, volume: action.payload, isMuted: action.payload === 0 };

    case ActionTypes.TOGGLE_MUTE:
      return { ...state, isMuted: !state.isMuted };

    case ActionTypes.TOGGLE_SHUFFLE:
      return { ...state, shuffle: !state.shuffle };

    case ActionTypes.CYCLE_REPEAT: {
      const modes = ['off', 'all', 'one'];
      const idx = modes.indexOf(state.repeat);
      return { ...state, repeat: modes[(idx + 1) % modes.length] };
    }

    case ActionTypes.SET_QUEUE:
      return { ...state, queue: resolveTrackList(action.payload) };

    case ActionTypes.ADD_TO_QUEUE: {
      const track = resolveTrack(action.payload);
      if (!track) return state;
      // Avoid duplicates in the immediate queue
      if (state.queue.some((t) => t.id === track.id)) return state;
      return { ...state, queue: [...state.queue, track] };
    }

    case ActionTypes.REMOVE_FROM_QUEUE: {
      const trackId = typeof action.payload === 'string' ? action.payload : action.payload?.id;
      return {
        ...state,
        queue: state.queue.filter((t) => t.id !== trackId),
      };
    }

    case ActionTypes.UPDATE_TIME:
      return { ...state, currentTime: action.payload };

    case ActionTypes.SET_DURATION:
      return { ...state, duration: action.payload };

    case ActionTypes.SET_SLEEP_TIMER:
      return { ...state, sleepTimer: { remaining: action.payload * 60 } };

    case ActionTypes.CANCEL_SLEEP_TIMER:
      return { ...state, sleepTimer: null };

    case ActionTypes.SET_PLAYBACK_RATE:
      return { ...state, playbackRate: action.payload };

    case ActionTypes.TOGGLE_QUEUE:
      return { ...state, showQueue: !state.showQueue, showLyrics: false };

    case ActionTypes.TOGGLE_LYRICS:
      return { ...state, showLyrics: !state.showLyrics, showQueue: false };

    case ActionTypes.PLAY_ALBUM:
    case ActionTypes.PLAY_PLAYLIST: {
      const trackList = resolveTrackList(action.payload);
      if (trackList.length === 0) return state;
      return {
        ...state,
        currentTrack: trackList[0],
        queue: trackList,
        isPlaying: true,
        currentTime: 0,
        playHistory: [...state.playHistory.slice(-49), trackList[0]],
      };
    }

    default:
      return state;
  }
}

/* ====================================================================== */
/*  Context                                                                */
/* ====================================================================== */

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const engineRef = useRef(null);
  const rafRef = useRef(null);
  const prevTrackRef = useRef(null);

  /* ------ Lazy engine creation ------ */
  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
    }
    return engineRef.current;
  }, []);

  /* ------ Time-update loop via requestAnimationFrame ------ */
  const startTimeLoop = useCallback(() => {
    const tick = () => {
      const engine = engineRef.current;
      if (engine) {
        const t = engine.getCurrentTime();
        const d = engine.getDuration();
        dispatch({ type: ActionTypes.UPDATE_TIME, payload: t });
        if (d && isFinite(d)) {
          dispatch({ type: ActionTypes.SET_DURATION, payload: d });
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTimeLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  /* ------ React to state changes ------ */

  // Track changed -> load & play
  useEffect(() => {
    if (!state.currentTrack) return;
    // Only reload if the track actually changed
    if (prevTrackRef.current?.id === state.currentTrack.id) return;
    prevTrackRef.current = state.currentTrack;

    const engine = getEngine();
    engine.init();

    // Wire up track-end handler
    engine.onTrackEnd = () => {
      dispatch({ type: ActionTypes.NEXT_TRACK });
    };

    engine.loadTrack(state.currentTrack.audioSrc);
    engine.play();
    startTimeLoop();
  }, [state.currentTrack, getEngine, startTimeLoop]);

  // Play / pause
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !state.currentTrack) return;

    if (state.isPlaying) {
      engine.play();
      startTimeLoop();
    } else {
      engine.pause();
      stopTimeLoop();
    }
  }, [state.isPlaying, state.currentTrack, startTimeLoop, stopTimeLoop]);

  // Volume
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (state.isMuted) {
      engine.mute();
    } else {
      engine.unmute();
      engine.setVolume(state.volume);
    }
  }, [state.volume, state.isMuted]);

  // Playback rate
  useEffect(() => {
    const engine = engineRef.current;
    if (engine) engine.setPlaybackRate(state.playbackRate);
  }, [state.playbackRate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimeLoop();
      if (engineRef.current) engineRef.current.destroy();
    };
  }, [stopTimeLoop]);

  /* ------ Update sleep timer remaining (every second) ------ */
  useEffect(() => {
    if (!state.sleepTimer) return;
    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;
      const remaining = engine.getSleepTimerRemaining();
      if (remaining !== null && remaining > 0) {
        dispatch({ type: ActionTypes.SET_SLEEP_TIMER, payload: remaining / 60 });
      } else if (remaining === 0 || remaining === null) {
        dispatch({ type: ActionTypes.CANCEL_SLEEP_TIMER });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state.sleepTimer !== null]);

  /* ------ Action creators exposed via context ------ */

  const playTrack = useCallback((track, queue) => {
    dispatch({ type: ActionTypes.PLAY_TRACK, payload: { track, queue } });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: ActionTypes.PAUSE });
  }, []);

  const resume = useCallback(() => {
    dispatch({ type: ActionTypes.RESUME });
  }, []);

  const next = useCallback(() => {
    dispatch({ type: ActionTypes.NEXT_TRACK });
  }, []);

  const prev = useCallback(() => {
    dispatch({ type: ActionTypes.PREV_TRACK });
    // If restarting, also seek audio engine
    if (state.currentTime > 3) {
      const engine = engineRef.current;
      if (engine) engine.seek(0);
    }
  }, [state.currentTime]);

  const seek = useCallback((time) => {
    dispatch({ type: ActionTypes.SEEK, payload: time });
    const engine = engineRef.current;
    if (engine) engine.seek(time);
  }, []);

  const setVolume = useCallback((vol) => {
    dispatch({ type: ActionTypes.SET_VOLUME, payload: vol });
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_MUTE });
  }, []);

  const toggleShuffle = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_SHUFFLE });
  }, []);

  const cycleRepeat = useCallback(() => {
    dispatch({ type: ActionTypes.CYCLE_REPEAT });
  }, []);

  const addToQueue = useCallback((track) => {
    dispatch({ type: ActionTypes.ADD_TO_QUEUE, payload: track });
  }, []);

  const removeFromQueue = useCallback((trackId) => {
    dispatch({ type: ActionTypes.REMOVE_FROM_QUEUE, payload: trackId });
  }, []);

  const playPlaylist = useCallback((trackIds) => {
    dispatch({ type: ActionTypes.PLAY_PLAYLIST, payload: trackIds });
  }, []);

  const playAlbum = useCallback((trackIds) => {
    dispatch({ type: ActionTypes.PLAY_ALBUM, payload: trackIds });
  }, []);

  const toggleQueue = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_QUEUE });
  }, []);

  const toggleLyrics = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_LYRICS });
  }, []);

  const setSleepTimer = useCallback((minutes) => {
    const engine = getEngine();
    engine.init();
    engine.setSleepTimer(minutes, () => {
      dispatch({ type: ActionTypes.PAUSE });
      dispatch({ type: ActionTypes.CANCEL_SLEEP_TIMER });
    });
    dispatch({ type: ActionTypes.SET_SLEEP_TIMER, payload: minutes });
  }, [getEngine]);

  const cancelSleepTimer = useCallback(() => {
    const engine = engineRef.current;
    if (engine) engine.cancelSleepTimer();
    dispatch({ type: ActionTypes.CANCEL_SLEEP_TIMER });
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    dispatch({ type: ActionTypes.SET_PLAYBACK_RATE, payload: rate });
  }, []);

  const getFFTData = useCallback(() => {
    const engine = engineRef.current;
    return engine ? engine.getFFTData() : new Uint8Array(0);
  }, []);

  const getWaveformData = useCallback(() => {
    const engine = engineRef.current;
    return engine ? engine.getWaveformData() : new Uint8Array(0);
  }, []);

  /* ------ Context value ------ */

  const value = {
    state,
    ...state,
    playTrack,
    pause,
    resume,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    addToQueue,
    removeFromQueue,
    playPlaylist,
    playAlbum,
    toggleQueue,
    toggleLyrics,
    setSleepTimer,
    cancelSleepTimer,
    setPlaybackRate,
    getFFTData,
    getWaveformData,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayer must be used within a <PlayerProvider>');
  }
  return ctx;
}

export default PlayerContext;
