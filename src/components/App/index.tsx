import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { setMuted, getIsMuted, pauseVideo, getVideoEl, fadeInVideoEl, fadeOutVideoEl } from './utils.js'
import { isMuted } from './state.js';
import styles from "./styles.scss";
import airpods from "./airpods.svg";
import airpodsInverted from "./airpods-inverted.svg";
import mute from "./volume-mute.svg";
import unmute from "./volume.svg";
import blingSrc from './bling.mp3'

/** This has to be 0.0 for now (don't ask questions) */
const OBSERVATION_RATIO = 0.0;

/** Controls proportion of screen to cut observer margin */
const OBSERVATION_MARGIN_RATIO = 0.35;

/** Class name for currently active Odyssey block media */
const CLASS_ACTIVE = 'play-active';

/**
 * Supported video types.
 * 1. Odyssey video player root
 * 2. Any <video> element inside a `class="oavp-video"` parent
 */
const VIDEO_PLAYER_QUERY_SELECTOR = ".VideoPlayer,.oavp-video video";

// This is done when element observed
const intersectionObserverCallback = (entries, observer) => {
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
/**
 * When an Odyssey contains multiple videos in blocks, intended to crossfade
 * between them, only the first video is observed, because the rest are
 * on-screen but invisible.
 *
 * Instead we check whether they're visible using a mutation observer on the
 * class property.
 */
const mutationObserverCallback = (mutationList) => {
  mutationList.forEach(({ target, oldValue }) => {
    const isActive = target.classList.contains(CLASS_ACTIVE);
    const wasActive = oldValue.includes(CLASS_ACTIVE);

    // fade this vid in
    if (isActive && !wasActive) {
      return fadeInVideoEl(target);
    }

    // Fade this vid out
    if (!isActive && wasActive) {
      return fadeOutVideoEl(target);
    }
  });
}

const App = () => {
  const [showButton, setShowButton] = useState(false); // Floating mute
  const [videos, setVideos] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const audioPlayer = useRef();

  const muteEl = useRef<any>(null);

  /** find and return compatible videos + update observers */
  const scanForVideos = () => {
    const nodeList = Array.from(document.querySelectorAll(VIDEO_PLAYER_QUERY_SELECTOR));
    setVideos(nodeList);
    return nodeList;
  }


  const muteToggle = () => {
    const isMutedNow = !isMuted.value;

    if (isMutedNow) {
      scanForVideos().forEach(video => {
        setMuted(video, isMutedNow);
      });
    }

    // Fade in the currently on-screen Odyssey video, otherwise it will be
    // unmuted with a volume of 0
    const activeVideo = document.querySelector(`.${CLASS_ACTIVE}`);

    if (activeVideo) {
      fadeInVideoEl(activeVideo);
    }

    isMuted.value = isMutedNow;

    if (!isMutedNow) {
      // @ts-ignore
      audioPlayer.current.play();
    }
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

    // observe when videos scroll onto the screen
    const intersectionObserver = new IntersectionObserver(intersectionObserverCallback, {
      root: null,
      rootMargin: `-${window.innerHeight * OBSERVATION_MARGIN_RATIO}px 0px`,
      threshold: OBSERVATION_RATIO
    });

    // observe for when videos are crossfaded in
    const mutationObserver = new MutationObserver(mutationObserverCallback);

    // Add video players to our intersectionObserver
    videos.forEach(video => {
      const isOdysseyBlockVideo = video.matches('.Block-media *');
      if (isOdysseyBlockVideo) {
        // Odyssey block videos all appear at once, stacked on each other. This confuses the intersection observer.
        // So let's use the mutation observer to check which video has the playing class.
        mutationObserver.observe(video, { attributes: true, attributeOldValue: true, attributeFilter: ['class'] });
      } else
        // Regular videos play when they intersect with the viewport.
        intersectionObserver.observe(video.parentNode);


      // Initially set videos to muted, in case not ambient
      // And pause
      setMuted(video, isMuted)

      // Set volume to zero so we can fade in
      getVideoEl(video).volume = 0.0;
      // Do not set preload on videos, otherwise mobile devices will try to pre-download the entire world.
      // videoEl.preload = "auto";

      // Trick non-ambient videos into playing more
      // than 1 video at a time
      if (video.api) {
        video.api.isAmbient = true;
      }

      eventListener = () => {
        isMuted.value = (!isMuted.value);

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

      intersectionObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [videos]);

  return (
    <div data-id="odyssey-audio-visual-plugin" className={styles.root} data-muted={isMuted.value}>
      <div className={`${styles.icon}  ${!isMuted.value && styles.hidden}`}>
        {isDarkMode ? <img src={airpodsInverted} /> : <img src={airpods} />}
      </div>

      <div className={`${styles.text} ${styles.textContinueReading} ${isMuted.value && styles.hidden}`}>
        Keep scrolling to read the story
      </div>
      <div className={`${styles.text} ${styles.textSoundOn} ${!isMuted.value && styles.hidden}`}>
        This story is best<br />experienced with sound on
      </div>

      <button
        className={styles.enableAudio}
        id="toggle-global-audio-button"
        onClick={muteToggle}
        ref={muteEl}>
        {isMuted.value ? "ENABLE AUDIO" : "MUTE AUDIO"}
      </button>

      <div className={styles.audioFloatContainer}>
        <button
          id="toggle-global-audio-float"
          className={`${styles.audioFloat} ${!showButton && styles.hidden}`}
          onClick={muteToggle}>
          {isMuted.value ? <img src={mute} /> : <img src={unmute} />}
        </button>
      </div>
      <audio src={blingSrc} className={styles.audioplayer} ref={audioPlayer} />
    </div>
  );
};

export default App;
