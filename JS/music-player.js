/**
 * JS/music-player.js - Floating Music Player Widget
 * Plays songs from the Music/ directory with play/pause, skip, and volume controls.
 */

(function () {
    'use strict';

    // Playlist configuration - songs from the Music/ directory
    const PLAYLIST = [
        { file: '../Music/JEFFHARDY.mp3', name: 'Jeff Hardy' },
        { file: '../Music/krvacej.mp3', name: 'Krvácej' },
        { file: '../Music/kurvyvpozoru.mp3', name: 'Kurvy v pozorů' },
        { file: '../Music/tinted.mp3', name: 'Tinted' }
    ];

    class MusicPlayer {
        constructor() {
            this.audio = new Audio();
            this.audio.preload = 'metadata';
            this.currentIndex = 0;
            this.isPlaying = false;
            this.isMinimized = false;
            this.volume = 0.5;
            this.isMuted = false;

            // Set initial volume
            this.audio.volume = this.volume;

            // Bind events
            this.audio.addEventListener('ended', () => this.nextTrack());
            this.audio.addEventListener('timeupdate', () => this.updateProgress());
            this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
            this.audio.addEventListener('error', (e) => this.handleAudioError(e));

            // Build UI
            this.buildUI();
            this.bindEvents();
            this.updateTrackDisplay();
            this.updatePlaylistHighlight();
        }

        buildUI() {
            const player = document.createElement('div');
            player.className = 'music-player';
            player.id = 'musicPlayer';

            player.innerHTML = `
                <button class="music-player-toggle" id="musicPlayerToggle" aria-label="Toggle music player">
                    <span class="music-player-title">
                        <span class="music-player-title-icon">🎵</span>
                        <span>Music Player</span>
                    </span>
                    <span class="music-player-chevron">▼</span>
                </button>
                <div class="music-player-body">
                    <div class="music-player-now">
                        <div class="music-player-track-name" id="musicTrackName">Select a track</div>
                        <div class="music-player-progress" id="musicProgress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                            <div class="music-player-progress-fill" id="musicProgressFill"></div>
                        </div>
                        <div class="music-player-time">
                            <span id="musicCurrentTime">0:00</span>
                            <span id="musicDuration">0:00</span>
                        </div>
                    </div>
                    <div class="music-player-controls">
                        <button class="music-player-btn" id="musicPrevBtn" title="Previous" aria-label="Previous track">⏮</button>
                        <button class="music-player-btn play-btn" id="musicPlayBtn" title="Play" aria-label="Play">▶</button>
                        <button class="music-player-btn" id="musicNextBtn" title="Next" aria-label="Next track">⏭</button>
                    </div>
                    <div class="music-player-volume">
                        <button class="music-player-volume-icon" id="musicVolumeIcon" title="Mute/Unmute" aria-label="Mute">🔊</button>
                        <input type="range" class="music-player-volume-slider" id="musicVolumeSlider" min="0" max="1" step="0.01" value="0.5" aria-label="Volume">
                    </div>
                    <div class="music-player-playlist" id="musicPlaylist">
                        ${PLAYLIST.map((track, i) => `
                            <div class="music-player-playlist-item" data-index="${i}" role="button" tabindex="0" aria-label="Play ${track.name}">
                                <span class="music-player-playlist-item-icon">🎶</span>
                                <span class="music-player-playlist-item-name">${track.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            document.body.appendChild(player);
        }

        bindEvents() {
            // Toggle minimize
            document.getElementById('musicPlayerToggle').addEventListener('click', () => this.toggleMinimize());

            // Play/Pause
            document.getElementById('musicPlayBtn').addEventListener('click', () => this.togglePlay());

            // Previous track
            document.getElementById('musicPrevBtn').addEventListener('click', () => this.prevTrack());

            // Next track
            document.getElementById('musicNextBtn').addEventListener('click', () => this.nextTrack());

            // Volume slider
            const volumeSlider = document.getElementById('musicVolumeSlider');
            volumeSlider.addEventListener('input', (e) => {
                this.volume = parseFloat(e.target.value);
                this.audio.volume = this.volume;
                this.isMuted = this.volume === 0;
                this.updateVolumeIcon();
            });

            // Mute/Unmute
            document.getElementById('musicVolumeIcon').addEventListener('click', () => this.toggleMute());

            // Progress bar click
            document.getElementById('musicProgress').addEventListener('click', (e) => this.seek(e));

            // Playlist item clicks
            document.querySelectorAll('.music-player-playlist-item').forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.dataset.index, 10);
                    this.playTrack(index);
                });
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const index = parseInt(item.dataset.index, 10);
                        this.playTrack(index);
                    }
                });
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                // Only handle if not focused on an input
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

                switch (e.code) {
                    case 'Space':
                        if (e.target.closest('.music-player')) {
                            e.preventDefault();
                            this.togglePlay();
                        }
                        break;
                }
            });
        }

        playTrack(index) {
            if (index < 0 || index >= PLAYLIST.length) return;

            this.currentIndex = index;
            this.audio.src = PLAYLIST[index].file;
            this.audio.play().then(() => {
                this.isPlaying = true;
                this.updatePlayButton();
                this.updateTrackDisplay();
                this.updatePlaylistHighlight();
            }).catch(err => {
                console.warn('Music player: playback failed', err);
            });
        }

        togglePlay() {
            if (!this.audio.src || this.audio.src === window.location.href) {
                // No track selected yet, play the first one
                this.playTrack(0);
                return;
            }

            if (this.isPlaying) {
                this.audio.pause();
                this.isPlaying = false;
            } else {
                this.audio.play().then(() => {
                    this.isPlaying = true;
                }).catch(err => {
                    console.warn('Music player: playback failed', err);
                });
            }
            this.updatePlayButton();
        }

        nextTrack() {
            const nextIndex = (this.currentIndex + 1) % PLAYLIST.length;
            this.playTrack(nextIndex);
        }

        prevTrack() {
            // If more than 3 seconds in, restart the current track
            if (this.audio.currentTime > 3) {
                this.audio.currentTime = 0;
                return;
            }
            const prevIndex = (this.currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
            this.playTrack(prevIndex);
        }

        toggleMute() {
            this.isMuted = !this.isMuted;
            this.audio.muted = this.isMuted;
            this.updateVolumeIcon();
        }

        seek(e) {
            const progress = document.getElementById('musicProgress');
            const rect = progress.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const clamped = Math.max(0, Math.min(1, percent));

            if (this.audio.duration) {
                this.audio.currentTime = clamped * this.audio.duration;
            }
        }

        toggleMinimize() {
            const player = document.getElementById('musicPlayer');
            this.isMinimized = !this.isMinimized;
            player.classList.toggle('minimized', this.isMinimized);
        }

        updateProgress() {
            if (!this.audio.duration) return;

            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            document.getElementById('musicProgressFill').style.width = percent + '%';
            document.getElementById('musicProgress').setAttribute('aria-valuenow', Math.round(percent));
            document.getElementById('musicCurrentTime').textContent = this.formatTime(this.audio.currentTime);
        }

        updateDuration() {
            document.getElementById('musicDuration').textContent = this.formatTime(this.audio.duration);
        }

        updateTrackDisplay() {
            const track = PLAYLIST[this.currentIndex];
            if (track) {
                document.getElementById('musicTrackName').textContent = track.name;
            }
        }

        updatePlayButton() {
            const btn = document.getElementById('musicPlayBtn');
            btn.textContent = this.isPlaying ? '⏸' : '▶';
            btn.title = this.isPlaying ? 'Pause' : 'Play';
            btn.setAttribute('aria-label', this.isPlaying ? 'Pause' : 'Play');
        }

        updateVolumeIcon() {
            const icon = document.getElementById('musicVolumeIcon');
            if (this.isMuted || this.volume === 0) {
                icon.textContent = '🔇';
            } else if (this.volume < 0.3) {
                icon.textContent = '🔈';
            } else if (this.volume < 0.7) {
                icon.textContent = '🔉';
            } else {
                icon.textContent = '🔊';
            }
        }

        updatePlaylistHighlight() {
            document.querySelectorAll('.music-player-playlist-item').forEach((item, i) => {
                item.classList.toggle('active', i === this.currentIndex);
            });
        }

        handleAudioError(e) {
            console.warn('Music player: audio error', e);
            // Try to play next track on error
            setTimeout(() => this.nextTrack(), 1000);
        }

        formatTime(seconds) {
            if (isNaN(seconds) || !isFinite(seconds)) return '0:00';

            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.musicPlayer = new MusicPlayer();
        });
    } else {
        window.musicPlayer = new MusicPlayer();
    }

})();
