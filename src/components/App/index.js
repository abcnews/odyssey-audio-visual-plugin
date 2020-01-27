import { h, Component } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import { createPortal } from "preact/compat";

import styles from "./styles.scss";
import airpods from "./airpods.svg";
import airpodsInverted from "./airpods-inverted.svg";
import mute from "./mute.svg";
import unmute from "./unmute.svg";

// This has to be 0.0 for now
const OBSERVATION_RATIO = 0.0;
// Controls proportion of screen to cut observer margin
const OBSERVATION_MARGIN_RATIO = 0.2

const App = props => {
  const [isMuted, _setIsMuted] = useState(true); // Start muted
  const [showButton, setShowButton] = useState(false); // Floating mute
  const [videos, setVideos] = useState();
  const [freezeFrameVideos, setFreezeFrameVideos] = useState();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const muteEl = useRef(null);

  // Used to access state in eventListeners
  const stateRef = useRef(isMuted);

  const setIsMuted = data => {
    stateRef.current = data;
    _setIsMuted(data);
  };

  const muteToggle = event => {
    videos.forEach(video => {
      video.api.setMuted(!isMuted);
    });

    setIsMuted(!isMuted);

    // Unmute freezeframe videos
    freezeFrameVideos.forEach(video => {
      video.muted = !isMuted;
    });
  };

  // This is done when element observed
  const observerCallback = (entries, observer) => {
    // if (video.parentNode.classList.contains("is-fixed")) {
    //   player =
    // }

    entries.forEach(entry => {
      const player = entry.target.firstChild;

      // Don't fire on load
      // if (entry.intersectionRatio === 0) {
      //   // First pause all vids not in view
      //   setTimeout(() => {
      //     player.api.pause();
      //   }, 1000);

      //   return;
      // }

      // Observe coming into view
      if (entry.intersectionRatio > OBSERVATION_RATIO) {
        // Get the actual video element
        const entryVid = player.querySelector("video");

        // Play the video
        if (player.api.isPaused()) player.api.play();

        // If we're already fading out, then stop
        clearInterval(entryVid.fadeOutIntervalId);

        // Fade in
        if (entryVid.volume < 1.0) {
          let vol = entryVid.volume;
          let interval = 200;

          entryVid.fadeInIntervalId = setInterval(function() {
            // Reduce volume as long as it is above 0
            if (vol < 1.0) {
              vol += 0.4;
              if (vol > 1.0) vol = 1.0;
              entryVid.volume = vol.toFixed(2);
            } else {
              // Stop the setInterval when 0 is reached
              clearInterval(entryVid.fadeInIntervalId);
            }
          }, interval);
        }
        // Observe going out of view
      } else {
        const entryVid = player.querySelector("video");

        // If we're already fading in, then stop
        clearInterval(entryVid.fadeInIntervalId);

        if (entryVid.volume > 0.0) {
          let vol = entryVid.volume;
          let interval = 200;

          entryVid.fadeOutIntervalId = setInterval(function() {
            // Reduce volume as long as it is above 0
            if (vol > 0) {
              vol -= 0.1;
              if (vol < 0.0) vol = 0.0;
              entryVid.volume = vol.toFixed(2);
            } else {
              // Stop the setInterval when 0 is reached
              player.api.pause();
              clearInterval(entryVid.fadeOutIntervalId);
            }
          }, interval);
        }
      }
    });
  };

  // const fixedObserverCallback = (entries, observer) => {
  //   entries.forEach(entry => {
  //     console.log(entry);

  //     const videoDiv = entry.target.firstChild;

  //     // Return on initial load
  //     if (
  //       entry.boundingClientRect.y >
  //       window.innerHeight + window.innerHeight / 2
  //     ) {
  //       videoDiv.api.pause()
  //       return;
  //     }

  //     videoDiv.api.play()
  //   });
  // };

  // Init effect run on mount
  useEffect(() => {
    // Select all Odyssey video player div elements
    setVideos(document.querySelectorAll(".VideoPlayer"));

    // Wait for FreezeFrame to load
    // TODO: find a better way to do this
    setTimeout(() => {
      setFreezeFrameVideos(document.querySelectorAll(".AC_W_aNL video"));
    }, 1000);

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
      rootMargin: "0px",
      threshold: 0.0
    });

    buttonObserver.observe(muteEl.current);

    // For IE11 support let's invert colors manually
    // instead of useing CSS filter: invert(1)
    const html = document.querySelector("html");
    if (html.classList.contains("is-dark-mode")) setIsDarkMode(true);

    return () => {
      buttonObserver.unobserve(muteEl.current);
    };
  }, []);

  // Run after videos have been detected
  useEffect(() => {
    let videoMuteButton;

    if (typeof videos === "undefined") return;

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: `-${window.innerHeight * OBSERVATION_MARGIN_RATIO}px 0px`,
      threshold: OBSERVATION_RATIO
    });

    // const fixedObserver = new IntersectionObserver(fixedObserverCallback, {
    //   root: null,
    //   rootMargin: "0px",
    //   threshold: 0.0
    // });

    // Add video players to our observer
    videos.forEach(video => {
      // console.log(video.parentNode.classList.contains("is-fixed"));
      // if (video.parentNode.classList.contains("is-fixed"))
      //   fixedObserver.observe(video.parentNode);
      // else observer.observe(video);

      observer.observe(video.parentNode);

      // Initially set videos to muted, in case not ambient
      // if (!video.api.isAmbient)
      video.api.setMuted(isMuted);
      video.api.pause();

      // Set volume to zero so we can fade in
      const videoEl = video.querySelector("video");
      videoEl.volume = 0.0;

      // Also set preload to auto to help playback
      videoEl.preload = "auto";

      // Trick non-ambient videos into playing more
      // than 1 video at a time
      video.api.isAmbient = true;

      const eventListener = () => {
        setIsMuted(!stateRef.current);

        videos.forEach(vid => {
          if (vid.api.isMuted()) vid.api.setMuted(false);
          else if (!vid.api.isMuted()) vid.api.setMuted(true);
        });

        if (typeof freezeFrameVideos !== "undefined")
          freezeFrameVideos.forEach(video => {
            video.muted = !video.muted;
          });
      };

      // Make "fake-ambient" videos support mute
      videoMuteButton = video.querySelector(".VideoControls-mute");

      if (videoMuteButton)
        videoMuteButton.addEventListener("click", eventListener);
    });

    return () => {
      if (videoMuteButton)
        videoMuteButton.removeEventListener("click", eventListener);

      videos.forEach(video => {
        //   if (video.parentNode.classList.contains("is-fixed"))
        //   fixedObserver.unobserve(video.parentNode);
        // else observer.unobserve(video);

        observer.unobserve(video);
      });
    };
  }, [videos]);

  return (
    <div className={styles.root}>
      <div className={`${styles.icon}  ${!isMuted && styles.hidden}`}>
        {isDarkMode ? <img src={airpodsInverted} /> : <img src={airpods} />}
      </div>

      <div className={`${styles.text} ${isMuted && styles.hidden}`}>
        KEEP SCROLLING TO READ THE STORY
      </div>

      <div className={`${styles.text} ${!isMuted && styles.hidden}`}>
        THIS STORY IS BEST EXPERIENCED WITH SOUND ON
      </div>

      <button
        className={styles.enableAudio}
        id="toggle-global-audio-button"
        onClick={muteToggle}
        ref={muteEl}
      >
        {isMuted ? "ENABLE AUDIO" : "MUTE AUDIO"}
      </button>

      {createPortal(
        <button
          id="toggle-global-audio-float"
          className={`${styles.audioFloat} ${!showButton && styles.hidden}`}
          onClick={muteToggle}
        >
          {isMuted ? <img src={mute} /> : <img src={unmute} />}
        </button>,
        document.body
      )}
    </div>
  );
};

export default App;
