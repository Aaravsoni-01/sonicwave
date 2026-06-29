/**
 * AudioEngine - Web Audio API wrapper for Sonicwave
 *
 * Uses an HTML5 Audio element for actual playback (handles decoding,
 * buffering, network, and media-session integration). The Audio element
 * is connected to a Web Audio API graph via createMediaElementSource so
 * we get an AnalyserNode for real-time FFT / waveform visualisation.
 *
 * AudioContext is created lazily on the first user-gesture to comply
 * with browser autoplay policies.
 */
export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.audioElement = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.analyserNode = null;
    this.sleepTimerId = null;
    this._sleepTimerEnd = null;
    this._sleepCallback = null;
    this.onTrackEnd = null;
    this.onTimeUpdate = null;
    this._initialized = false;
    this._previousVolume = 0.7;
  }

  /* ------------------------------------------------------------------ */
  /*  Initialisation                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Create AudioContext & wire up the graph.
   * Safe to call multiple times – will no-op after the first.
   */
  init() {
    if (this._initialized) return;

    // Create the HTML5 audio element
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'auto';
    this.audioElement.volume = 0.7;

    // Ended event -> call onTrackEnd callback
    this.audioElement.addEventListener('ended', () => {
      if (this.onTrackEnd) this.onTrackEnd();
    });

    // Time-update for progress tracking
    this.audioElement.addEventListener('timeupdate', () => {
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.audioElement.currentTime, this.audioElement.duration || 0);
      }
    });

    // Create Web Audio API context
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioCtx();

    // Connect Audio element -> source node -> gain -> analyser -> destination
    this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = this.audioElement.volume;

    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;

    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);

    this._initialized = true;
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                    */
  /* ------------------------------------------------------------------ */

  _ensureContext() {
    if (!this._initialized) this.init();
    // Resume suspended context (autoplay policy)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Transport controls                                                 */
  /* ------------------------------------------------------------------ */

  /**
   * Load a new audio source (URL or blob).
   * @param {string} src - URL to an audio file
   */
  loadTrack(src) {
    this._ensureContext();
    this.audioElement.src = src;
    this.audioElement.load();
  }

  async play() {
    this._ensureContext();
    try {
      await this.audioElement.play();
    } catch (err) {
      // Autoplay was prevented – nothing we can do until next user gesture
      console.warn('[AudioEngine] play() blocked:', err.message);
    }
  }

  pause() {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
  }

  async togglePlay() {
    if (!this.audioElement) return;
    if (this.audioElement.paused) {
      await this.play();
    } else {
      this.pause();
    }
  }

  /**
   * Seek to a specific time in seconds.
   * @param {number} time
   */
  seek(time) {
    if (!this.audioElement) return;
    const clamped = Math.max(0, Math.min(time, this.audioElement.duration || 0));
    this.audioElement.currentTime = clamped;
  }

  /* ------------------------------------------------------------------ */
  /*  Volume                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Set volume (0 – 1).
   * @param {number} vol
   */
  setVolume(vol) {
    const v = Math.max(0, Math.min(1, vol));
    if (this.audioElement) this.audioElement.volume = v;
    if (this.gainNode) this.gainNode.gain.value = v;
    this._previousVolume = v > 0 ? v : this._previousVolume;
  }

  getVolume() {
    return this.audioElement ? this.audioElement.volume : 0.7;
  }

  mute() {
    this._previousVolume = this.getVolume() || this._previousVolume;
    this.setVolume(0);
    if (this.audioElement) this.audioElement.muted = true;
  }

  unmute() {
    if (this.audioElement) this.audioElement.muted = false;
    this.setVolume(this._previousVolume || 0.7);
  }

  /* ------------------------------------------------------------------ */
  /*  Position / duration                                                */
  /* ------------------------------------------------------------------ */

  getCurrentTime() {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  getDuration() {
    return this.audioElement && isFinite(this.audioElement.duration)
      ? this.audioElement.duration
      : 0;
  }

  /* ------------------------------------------------------------------ */
  /*  Analyser data (for visualisers)                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Returns frequency-domain data as a Uint8Array.
   * Length = analyserNode.frequencyBinCount (fftSize / 2).
   */
  getFFTData() {
    if (!this.analyserNode) return new Uint8Array(0);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  /**
   * Returns time-domain waveform data as a Uint8Array.
   */
  getWaveformData() {
    if (!this.analyserNode) return new Uint8Array(0);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(data);
    return data;
  }

  /* ------------------------------------------------------------------ */
  /*  Sleep timer                                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Set a sleep timer that fires after `minutes`.
   * @param {number} minutes
   * @param {Function} onSleep - callback when timer fires
   */
  setSleepTimer(minutes, onSleep) {
    this.cancelSleepTimer();
    const ms = minutes * 60 * 1000;
    this._sleepTimerEnd = Date.now() + ms;
    this._sleepCallback = onSleep;

    this.sleepTimerId = setTimeout(() => {
      this.pause();
      this._sleepTimerEnd = null;
      this.sleepTimerId = null;
      if (this._sleepCallback) this._sleepCallback();
      this._sleepCallback = null;
    }, ms);
  }

  cancelSleepTimer() {
    if (this.sleepTimerId) {
      clearTimeout(this.sleepTimerId);
      this.sleepTimerId = null;
    }
    this._sleepTimerEnd = null;
    this._sleepCallback = null;
  }

  /**
   * Returns seconds remaining on the sleep timer, or null if none set.
   */
  getSleepTimerRemaining() {
    if (!this._sleepTimerEnd) return null;
    const remaining = Math.max(0, Math.round((this._sleepTimerEnd - Date.now()) / 1000));
    return remaining;
  }

  /* ------------------------------------------------------------------ */
  /*  Playback rate                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * @param {number} rate - e.g. 0.5, 1, 1.5, 2
   */
  setPlaybackRate(rate) {
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Cleanup                                                            */
  /* ------------------------------------------------------------------ */

  destroy() {
    this.cancelSleepTimer();

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.removeAttribute('src');
      this.audioElement.load();
    }

    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch (_) { /* noop */ }
    }
    if (this.gainNode) {
      try { this.gainNode.disconnect(); } catch (_) { /* noop */ }
    }
    if (this.analyserNode) {
      try { this.analyserNode.disconnect(); } catch (_) { /* noop */ }
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    this.audioContext = null;
    this.audioElement = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.analyserNode = null;
    this.onTrackEnd = null;
    this.onTimeUpdate = null;
    this._initialized = false;
  }
}
