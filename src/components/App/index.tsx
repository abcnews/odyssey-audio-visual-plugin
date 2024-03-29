import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { setMuted, getIsMuted, getVideoEl, fadeInVideoEl, fadeOutVideoEl } from './utils.js'

import styles from "./styles.scss";
import airpods from "./airpods.svg";
import airpodsInverted from "./airpods-inverted.svg";
import mute from "./volume-mute.svg";
import unmute from "./volume.svg";

// This has to be 0.0 for now (don't ask questions)
const OBSERVATION_RATIO = 0.0;

// Controls proportion of screen to cut observer margin
const OBSERVATION_MARGIN_RATIO = 0.35;

/**
 * Supported video types.
 * 1. Odyssey video player root
 * 2. Any <video> element inside a `class="oavp-video"` parent
 */
const VIDEO_PLAYER_QUERY_SELECTOR = ".VideoPlayer,.oavp-video video";

// This is done when element observed
const observerCallback = (entries, observer) => {
  entries.forEach(entry => {
    const videoPlayer = entry.target.querySelector(VIDEO_PLAYER_QUERY_SELECTOR);
    if (!videoPlayer) return;
    if (entry.intersectionRatio > OBSERVATION_RATIO) {
      fadeInVideoEl(videoPlayer);
    } else {
      // Observe going out of view
      fadeOutVideoEl(videoPlayer);
    }
  });
};


const App = () => {
  const [isMuted, _setIsMuted] = useState(true); // Start muted
  const [showButton, setShowButton] = useState(false); // Floating mute
  const [videos, setVideos] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const muteEl = useRef<any>(null);

  // Used to access state in eventListeners
  const stateRef = useRef(isMuted);

  /** find and return compatible videos + update observers */
  const scanForVideos = () => {
    const nodeList = Array.from(document.querySelectorAll(VIDEO_PLAYER_QUERY_SELECTOR));
    setVideos(nodeList);
    return nodeList;
  }

  const setIsMuted = data => {
    stateRef.current = data;
    _setIsMuted(data);
  };

  const muteToggle = event => {
    scanForVideos().forEach(video => {
      setMuted(video, !isMuted);
    });

    setIsMuted(!isMuted);
  };

  // Init effect run on mount
  useEffect(() => {
    scanForVideos();
    // Showing and hiding the floating mute button
    const buttonObserverCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.intersectionRatio === 0) {
          setShowButton(true);
        } else {
          setShowButton(false);
        }
      });
    };

    const buttonObserver = new IntersectionObserver(buttonObserverCallback, {
      root: null,
      rootMargin: `0px 0px ${window.innerHeight}px`,
      threshold: 0.0
    });

    buttonObserver.observe(muteEl.current);

    // For IE11 support let's invert colors manually
    // instead of useing CSS filter: invert(1)
    const html = document.querySelector("html");
    if (html?.classList.contains("is-dark-mode")) {
      setIsDarkMode(true);
    }

    return () => {
      buttonObserver.unobserve(muteEl.current);
      buttonObserver.disconnect();
    };
  }, []);

  // Run after videos have been detected
  useEffect(() => {
    let videoMuteButton;
    let eventListener;

    if (typeof videos === "undefined") return;

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: `-${window.innerHeight * OBSERVATION_MARGIN_RATIO}px 0px`,
      threshold: OBSERVATION_RATIO
    });

    // Add video players to our observer
    videos.forEach(video => {
      observer.observe(video.parentNode);

      // Initially set videos to muted, in case not ambient
      // And pause
      setMuted(video, isMuted)

      // Set volume to zero so we can fade in
      getVideoEl(video).volume = 0.0;

      // Also set preload to auto to help playback
      // DON'T DO THIS OR BAD THINGS WILL HAPPEN ON MOBILE WITH LOTS OF VIDS
      // videoEl.preload = "auto";

      // Trick non-ambient videos into playing more
      // than 1 video at a time
      if (video.api) {
        video.api.isAmbient = true;
      }

      eventListener = () => {
        setIsMuted(!stateRef.current);

        videos.forEach(vid => {
          setMuted(vid, !getIsMuted(vid))
        });
      };

      // Make "fake-ambient" videos support mute
      videoMuteButton = video.querySelector(".VideoControls-mute");

      if (videoMuteButton) videoMuteButton.addEventListener("click", eventListener);
    });

    return () => {
      if (videoMuteButton) videoMuteButton.removeEventListener("click", eventListener);

      videos.forEach(video => {
        try {
          observer.unobserve(video);
        } catch (e) {
          // Sometimes videos disappear before we can unobserve them, especially
          // during development
        }
      });

      observer.disconnect();
    };
  }, [videos]);

  return (
    <div data-id="odyssey-audio-visual-plugin" className={styles.root} data-muted={isMuted}>
      <div className={`${styles.icon}  ${!isMuted && styles.hidden}`}>
        {isDarkMode ? <img src={airpodsInverted} /> : <img src={airpods} />}
      </div>

      <div className={`${styles.text} ${styles.textContinueReading} ${isMuted && styles.hidden}`}>
        Keep scrolling to read the story
      </div>
      <div className={`${styles.text} ${styles.textSoundOn} ${!isMuted && styles.hidden}`}>
        This story is best<br />experienced with sound on
      </div>

      <button
        className={styles.enableAudio}
        id="toggle-global-audio-button"
        onClick={muteToggle}
        ref={muteEl}>
        {isMuted ? "ENABLE AUDIO" : "MUTE AUDIO"}
      </button>

      <div className={styles.audioFloatContainer}>
        <button
          id="toggle-global-audio-float"
          className={`${styles.audioFloat} ${!showButton && styles.hidden}`}
          onClick={muteToggle}>
          {isMuted ? <img src={mute} /> : <img src={unmute} />}
        </button>
      </div>
    </div>
  );
};

export default App;
