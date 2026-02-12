class SmartVideoPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize tracking state
    this.quartileEvents = {
      'start': false,
      'firstQuartlie': false,
      'midpoint': false,
      'thirdQuartlie': false,
      'completed': false
    };
  }

  // Centralized event tracking function
  trackVideoEvent(eventName, eventData = {}) {
    // Only track events if tracking is enabled
    if (!this.trackingEnabled) {
      return;
    }
    
    if (typeof window !== 'undefined' && window.adctvTracker) {
      window.adctvTracker.track(eventName, eventData);
    }
    
    // Optional: Still emit custom event for debugging or other listeners
    // this.dispatchEvent(new CustomEvent('videoTracking', {
    //   detail: {
    //     event: eventName,
    //     ...eventData
    //   }
    // }));
  }

  connectedCallback() {
    const src = this.getAttribute('src');
    const fit = this.getAttribute('fit') || 'fit';
    const autoplayOption = this.getAttribute('autoplay-option') || 'none';
    const autoPauseWhenOutOfView = this.hasAttribute('auto-pause-when-out-of-view');
    const muted = this.hasAttribute('muted');
    const preload = this.hasAttribute('preload');
    const loop = this.hasAttribute('loop');
    const enableControls = this.hasAttribute('enable-controls');
    const showPlayPause = this.hasAttribute('show-play-pause');
    const showMuteUnmute = this.hasAttribute('show-mute-unmute');
    const showProgressBar = this.hasAttribute('show-progress-bar');
    const progressBarPosition = this.getAttribute('progress-bar-position') || 'bottom';
    const showReplay = this.hasAttribute('show-replay');
    const playBtnAlign = this.getAttribute('play-btn-align') || 'Bottom Left';
    const muteBtnAlign = this.getAttribute('mute-btn-align') || 'Bottom Right';
    const countdownAlign = this.getAttribute('countdown-align') || 'Top Left';
    const playBtnPos = this.getAttribute('play-btn-pos');
    const muteBtnPos = this.getAttribute('mute-btn-pos');
    const countdownPos = this.getAttribute('countdown-pos');
    const background = this.getAttribute('background') || '#fff';
    const showCountdown = this.hasAttribute('show-countdown');
    const exitUrl = this.getAttribute('exit-url');
    const backgroundColor = this.getAttribute('background-color') || '#000';
    const controlSize = this.getAttribute('control-size') || 'medium';

    // Store tracking flag as class property
    this.trackingEnabled = this.hasAttribute('tracking');

    // Get control sizes based on controlSize attribute
    const getControlSizes = (size) => {
      const sizeMap = {
        'small': { control: '20px', countdown: '30px' },
        'medium': { control: '24px', countdown: '36px' },
        'large': { control: '32px', countdown: '48px' }
      };
      return sizeMap[size] || sizeMap['medium'];
    };

    const sizes = getControlSizes(controlSize);

    const style = document.createElement('style');
    style.textContent = `
      .video-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: ${backgroundColor};
      }
      video {
        width: 100%;
        height: 100%;
        object-fit: ${fit === 'crop' ? 'cover' : 'contain'};
      }
      .control-btn {
        position: absolute;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        width: ${sizes.control};
        height: ${sizes.control};
        z-index: 10;
      }
      .countdown {
        position: absolute;
        width: ${sizes.countdown};
        height: ${sizes.countdown};
        z-index: 10;
      }
      .progress-bar {
        position: absolute;
        ${progressBarPosition === 'top' ? 'top: 0;' : 'bottom: 0;'}
        left: 0;
        width: 100%;
        height: 4px;
        background-color: rgba(255, 255, 255, 0.3);
        z-index: 10;
        cursor: pointer;
      }
      .progress-bar-fill {
        height: 100%;
        background-color: ${background};
        width: 0%;
        transition: width 0.1s ease;
      }
      .progress-bar:hover {
        height: 6px;
      }
      .replay-btn {
        position: absolute;
        top: 5px;
        left: 5px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        width: ${sizes.countdown};
        height: ${sizes.countdown};
        z-index: 15;
        display: none;
        animation: spin 2s linear forwards;
      }
      @keyframes spin {
        0% { transform: rotateZ(-400deg); }
        70% { transform: rotateZ(0deg); }
        100% { transform: rotateZ(0deg); }
      }
    `;

    const wrapper = document.createElement('div');
    wrapper.className = 'video-wrapper';

    const video = document.createElement('video');
    video.src = src;
    if (autoplayOption === 'load') video.autoplay = true;
    if (muted) video.muted = true;
    if (loop) video.loop = true;
    if (preload) video.preload = 'auto';
    video.playsInline = true;
    video.controls = false;

    // Store video element as class property for external access
    this.video = video;

    wrapper.appendChild(video);

    // Countdown timer
    const countdown = document.createElement('div');
    countdown.className = 'countdown';
    countdown.innerHTML = `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" fill-rule="evenodd">
          <circle cx="18" cy="18" r="16" stroke="${background}" stroke-width="2" stroke-opacity="0.3" />
          <circle cx="18" cy="18" r="16" stroke="${background}" stroke-width="2" fill="none" 
                  style="stroke-dasharray:100.53;stroke-dashoffset:0;transform:rotate(-90deg);transform-origin:18px 18px;" />
          <text x="18" y="22" text-anchor="middle" font-size="10" fill="white" font-weight="bold">0</text>
        </g>
      </svg>`;
    if (enableControls && showCountdown) wrapper.appendChild(countdown);

    // Controls
    const playBtn = document.createElement('button');
    playBtn.className = 'control-btn';
    playBtn.innerHTML = this.getPlayIcon(background);
    this.alignControl(playBtn, playBtnAlign, playBtnPos);

    const muteBtn = document.createElement('button');
    muteBtn.className = 'control-btn';
    muteBtn.innerHTML = this.getMuteIcon(background);
    this.alignControl(muteBtn, muteBtnAlign, muteBtnPos);

    // Apply alignment to countdown timer
    this.alignControl(countdown, countdownAlign, countdownPos);

    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    const progressBarFill = document.createElement('div');
    progressBarFill.className = 'progress-bar-fill';
    progressBar.appendChild(progressBarFill);

    // Replay button
    const replayBtn = document.createElement('button');
    replayBtn.className = 'replay-btn';
    replayBtn.innerHTML = this.getReplayIcon(background);

    // Only show controls if enableControls is true and specific button options are true
    if (enableControls && showPlayPause) {
      wrapper.appendChild(playBtn);
    }
    
    if (enableControls && showMuteUnmute) {
      wrapper.appendChild(muteBtn);
    }
    
    if (enableControls && showProgressBar) {
      wrapper.appendChild(progressBar);
    }
    
    if (showReplay) {
      wrapper.appendChild(replayBtn);
    }

    playBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent exit URL click
      if (video.paused) {
        // Check if this is a resume (video has progress) vs initial play
        const isResume = video.currentTime > 0;
        
        video.play();
        playBtn.innerHTML = this.getPauseIcon(background);
        
        // Track resume event if video has progress
        if (isResume) {
          this.trackVideoEvent('resume', {
            currentTime: video.currentTime,
            duration: video.duration
          });
        }
      } else {
        video.pause();
        playBtn.innerHTML = this.getPlayIcon(background);
      }
    });

    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent exit URL click
      video.muted = !video.muted;
      muteBtn.innerHTML = video.muted ? this.getMuteIcon(background) : this.getUnmuteIcon(background);
      
      // Track mute/unmute events (can be multiple times)
      this.trackVideoEvent(video.muted ? 'mute' : 'unmute', {
        muted: video.muted,
        currentTime: video.currentTime,
        duration: video.duration
      });
    });

    // Progress bar click functionality
    progressBar.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent exit URL click
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * video.duration;
      video.currentTime = newTime;
    });

    // Replay button click functionality
    replayBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent exit URL click
      video.currentTime = 0;
      video.play();
      replayBtn.style.display = 'none';
      
      // Show countdown again when video restarts
      if (enableControls && showCountdown) {
        countdown.style.display = 'block';
      }
      if (enableControls && showPlayPause) {
        playBtn.innerHTML = this.getPauseIcon(background);
      }
      
      // Track replay event (can be multiple times)
      this.trackVideoEvent('replay', {
        currentTime: video.currentTime,
        duration: video.duration
      });
    });

    // Add exit URL click functionality
    if (exitUrl) {
      wrapper.addEventListener('click', (e) => {
        // Don't redirect if clicking on controls
        if (e.target === playBtn || e.target === muteBtn || 
            playBtn.contains(e.target) || muteBtn.contains(e.target) ||
            e.target === countdown || countdown.contains(e.target) ||
            e.target === progressBar || progressBar.contains(e.target) ||
            e.target === replayBtn || replayBtn.contains(e.target)) {
          return;
        }
        
        // Open exit URL
        window.open(exitUrl, '_blank');
      });
      
      // Add cursor pointer style to indicate clickability
      wrapper.style.cursor = 'pointer';
    } else {
      // If no exit URL, clicking video area plays/pauses the video
      wrapper.addEventListener('click', (e) => {
        // Don't play/pause if clicking on controls
        if (e.target === playBtn || e.target === muteBtn || 
            playBtn.contains(e.target) || muteBtn.contains(e.target) ||
            e.target === countdown || countdown.contains(e.target) ||
            e.target === progressBar || progressBar.contains(e.target) ||
            e.target === replayBtn || replayBtn.contains(e.target)) {
          return;
        }
        
        // Toggle play/pause
        if (video.paused) {
          // Check if this is a resume (video has progress) vs initial play
          const isResume = video.currentTime > 0;
          
          video.play();
          
          // Track resume event if video has progress
          if (isResume) {
            this.trackVideoEvent('resume', {
              currentTime: video.currentTime,
              duration: video.duration
            });
          }
        } else {
          video.pause();
        }
      });
      
      // Add cursor pointer style to indicate clickability
      wrapper.style.cursor = 'pointer';
    }

    // Update play button icon when video play state changes
    video.addEventListener('play', () => {
      playBtn.innerHTML = this.getPauseIcon(background);
      
      // Show countdown when video starts playing (in case it was hidden)
      if (enableControls && showCountdown) {
        countdown.style.display = 'block';
      }
      
      // Emit start event on first play only (quartile event - track once)
      if (!this.quartileEvents['start']) {
        this.quartileEvents['start'] = true;
        this.trackVideoEvent('VideoStart', {
          value: 0,
          currentTime: video.currentTime,
          duration: video.duration
        });
      }
      
      // Emit play event (can be multiple times)
    //   this.trackVideoEvent('VideoPlay', {
    //     value: 0,
    //     currentTime: video.currentTime,
    //     duration: video.duration
    //   });
    });

    video.addEventListener('pause', () => {
      playBtn.innerHTML = this.getPlayIcon(background);
      
      // Emit pause event (can be multiple times)
      this.trackVideoEvent('pause', {
        currentTime: video.currentTime,
        duration: video.duration
      });
    });

    video.addEventListener('ended', () => {
      playBtn.innerHTML = this.getPlayIcon(background);
      if (showReplay) {
        replayBtn.style.display = 'block';
        // Hide countdown when replay button is shown
        if (enableControls && showCountdown) {
          countdown.style.display = 'none';
        }
      }
      
      // Track video end event (can happen multiple times if looped)
      this.trackVideoEvent('VideoEnded', {
        currentTime: video.currentTime,
        duration: video.duration
      });
    });

    // Reset quartile event tracking when video seeks to beginning
    video.addEventListener('seeked', () => {
      if (video.currentTime < video.duration * 0.25) {
        this.quartileEvents = {
          'start': false,
          'firstQuartlie': false,
          'midpoint': false,
          'thirdQuartlie': false,
          'completed': false
        };
      }
    });

    video.addEventListener('timeupdate', () => {
      const progress = (video.currentTime / video.duration) * 100;
      
      // Update progress bar if enabled
      if (showProgressBar && enableControls) {
        progressBarFill.style.width = progress + '%';
      }
      
      // Update countdown if enabled
      if (enableControls && showCountdown) {
        const remaining = Math.floor(video.duration - video.currentTime);
        countdown.querySelector('text').textContent = remaining;
        const offset = 100.53 - (video.currentTime / video.duration) * 100.53;
        countdown.querySelectorAll('circle')[1].style.strokeDashoffset = offset;
      }

      // Emit quartile tracking events (only once per video session, even in loops)
      if (progress >= 25 && !this.quartileEvents['firstQuartlie']) {
        this.quartileEvents['firstQuartlie'] = true;
        this.trackVideoEvent('firstQuartlie', {
          value: 25,
          currentTime: video.currentTime,
          duration: video.duration
        });
      }
      
      if (progress >= 50 && !this.quartileEvents['midpoint']) {
        this.quartileEvents['midpoint'] = true;
        this.trackVideoEvent('midpoint', {
          value: 50,
          currentTime: video.currentTime,
          duration: video.duration
        });
      }
      
      if (progress >= 75 && !this.quartileEvents['thirdQuartlie']) {
        this.quartileEvents['thirdQuartlie'] = true;
        this.trackVideoEvent('thirdQuartlie', {
          value: 75,
          currentTime: video.currentTime,
          duration: video.duration
        });
      }
      
      if (progress >= 97 && !this.quartileEvents['completed']) {
        this.quartileEvents['completed'] = true;
        this.trackVideoEvent('completed', {
          value: 97,
          currentTime: video.currentTime,
          duration: video.duration
        });
      }
    });

    if (autoplayOption === 'viewport' || autoPauseWhenOutOfView) {
      this.intersectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          console.log('Intersection observer triggered:', {
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            autoplayOption: autoplayOption,
            autoPauseWhenOutOfView: autoPauseWhenOutOfView,
            videoPaused: video.paused
          });
          
          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            if (autoplayOption === 'viewport') {
              console.log('Auto-playing video (viewport)');
              video.play().catch(e => console.log('Auto-play failed:', e));
            }
          } else if (entry.intersectionRatio === 0) {
            if (autoPauseWhenOutOfView && !video.paused) {
              console.log('Auto-pausing video (completely out of view)');
              video.pause();
            }
          }
        });
      }, { 
        threshold: [0, 0.1, 0.5, 1.0],
        rootMargin: '0px'
      });
      this.intersectionObserver.observe(this);
    }

    this.shadowRoot.append(style, wrapper);
  }

  disconnectedCallback() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  alignControl(el, align, pos) {
    if (align === 'Custom' && pos) {
      try {
        const obj = JSON.parse(pos);
        Object.assign(el.style, obj);
        return;
      } catch (e) {}
    }
    const map = {
      'Top Left': { top: '5px', left: '5px' },
      'Top Center': { top: '5px', left: '50%', transform: 'translateX(-50%)' },
      'Top Right': { top: '5px', right: '5px' },
      'Middle Left': { top: '50%', left: '5px', transform: 'translateY(-50%)' },
      'Center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
      'Middle Right': { top: '50%', right: '5px', transform: 'translateY(-50%)' },
      'Bottom Left': { bottom: '5px', left: '5px' },
      'Bottom Center': { bottom: '5px', left: '50%', transform: 'translateX(-50%)' },
      'Bottom Right': { bottom: '5px', right: '5px' }
    };
    Object.assign(el.style, map[align] || {});
  }

  getPlayIcon(t) {
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><rect width="24" height="24"/><g transform="translate(6,4)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.714"><polygon stroke="#FFFFFF" fill="#FFFFFF" points="0.5 0.5 12.5 8 0.5 15.5"></polygon><polygon stroke="${t}" fill="${t}" points="0.5 0.5 12.5 8 0.5 15.5"></polygon></g></g></svg>`;
  }

  getPauseIcon(t) {
    return `<svg width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><rect width="24" height="24"/><g transform="translate(6.5,4.5)" fill="${t}"><rect width="3.667" height="14.667"/><rect x="7.333" width="3.667" height="14.667"/></g></g></svg>`;
  }

  getMuteIcon(t) {
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><rect width="24" height="24"/><g transform="translate(3.5,6)" stroke="${t}" stroke-linecap="round" stroke-linejoin="round"><polygon stroke-width="1.763" fill="${t}" points="7.65 0 3.4 3.4 0 3.4 0 8.5 3.4 8.5 7.65 11.9"></polygon><g transform="translate(11.5,2.95)" stroke-width="1.5"><line x1="6" y1="0" x2="0" y2="6"/><line x1="0" y1="0" x2="6" y2="6"/></g></g></g></svg>`;
  }

  getUnmuteIcon(t) {
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><rect width="24" height="24"/><g transform="translate(3.5,6)" stroke="${t}" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.763"><polygon fill="${t}" points="7.65 0.85 3.4 4.25 0 4.25 0 9.35 3.4 9.35 7.65 12.75"></polygon><path d="M14.5095,0.7905 C17.8277465,4.10974874 17.8277465,9.49025126 14.5095,12.8095 M11.509,3.791 C13.1681232,5.45062437 13.1681232,8.14087563 11.509,9.8005"></path></g></g></svg>`;
  }

  getReplayIcon(t) {
    return `<svg viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <title>replay</title>
                <g id="ic_replay" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                    <g id="Group-6">
                        <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
                        <g id="replay" transform="translate(4.000000, 3.000000)" fill="${t}" fill-rule="nonzero" stroke="${t}" stroke-width="0.3">
                            <path d="M12.9007059,3.81364706 L12.0334118,4.92776471 C13.9025882,6.38235294 14.8352941,8.73741176 14.4675294,11.0743529 C13.9108235,14.6145882 10.5774118,17.0428235 7.03717647,16.4847059 C3.49717647,15.9270588 1.06988235,12.5934118 1.62635294,9.05341176 C1.896,7.33835294 2.81764706,5.83129412 4.22117647,4.80941176 C5.44635294,3.91764706 6.91129412,3.48870588 8.40376471,3.57364706 L7.18329412,4.85411765 L8.08870588,5.71788235 L10.0152941,3.69529412 L10.8788235,2.78964706 L9.97411765,1.92658824 L7.95176471,0 L7.088,0.906352941 L8.40564706,2.16141176 C6.61435294,2.07670588 4.86094118,2.59741176 3.39011765,3.668 C1.68188235,4.91176471 0.560235294,6.74635294 0.231764706,8.83411765 C-0.445647059,13.1430588 2.50847059,17.2007059 6.81741176,17.8792941 C7.23223529,17.9444706 7.64423529,17.976 8.05152941,17.976 C11.876,17.9757647 15.2494118,15.1877647 15.8621176,11.2936471 C16.3098824,8.44964706 15.1750588,5.58352941 12.9007059,3.81364706 Z" id="Path"></path>
                        </g>
                    </g>
                </g>
            </svg>`;
  }

  // Getter methods for external access
  get nativeElement() {
    return this.video;
  }

  get paused() {
    return this.video.paused;
  }

  get ended() {
    return this.video.ended;
  }

  get duration() {
    return this.video.duration;
  }

  get currentTime() {
    return this.video.currentTime;
  }

  get muted() {
    return this.video.muted;
  }

  // External control methods
  getDuration() {
    return this.video.duration;
  }

  getCurrentTime() {
    return this.video.currentTime;
  }

  setCurrentTime(time) {
    if (this.video && typeof time === 'number' && time >= 0) {
      this.video.currentTime = Math.min(time, this.video.duration || 0);
    }
  }

  rewind(seconds = 10) {
    if (this.video && typeof seconds === 'number') {
      const newTime = Math.max(0, this.video.currentTime - seconds);
      this.video.currentTime = newTime;
    }
  }

  play() {
    if (this.video) {
      // Check if this is a resume (video has progress) vs initial play
      const isResume = this.video.currentTime > 0 && this.video.paused;
      
      this.video.play();
      
      // Track resume event if video has progress and was paused
      if (isResume) {
        this.trackVideoEvent('resume', {
          currentTime: this.video.currentTime,
          duration: this.video.duration
        });
      }
    }
  }

  pause() {
    if (this.video && !this.video.paused) {
      this.video.pause();
    }
  }

  mute() {
    if (this.video) {
      this.video.muted = true;
      
      // Track mute event
      this.trackVideoEvent('mute', {
        muted: true,
        currentTime: this.video.currentTime,
        duration: this.video.duration
      });
    }
  }

  unmute() {
    if (this.video) {
      this.video.muted = false;
      
      // Track unmute event
      this.trackVideoEvent('unmute', {
        muted: false,
        currentTime: this.video.currentTime,
        duration: this.video.duration
      });
    }
  }

  replay() {
    if (this.video) {
      this.video.currentTime = 0;
      this.video.play();
      
      // Reset quartile events for new playthrough
      this.quartileEvents = {
        'start': false,
        'firstQuartlie': false,
        'midpoint': false,
        'thirdQuartlie': false,
        'completed': false
      };
      
      // Track replay event
      this.trackVideoEvent('replay', {
        currentTime: 0,
        duration: this.video.duration
      });
    }
  }
}

customElements.define('smart-video-player', SmartVideoPlayer);