import { h, Component } from "preact";
import { useState, useEffect, useLayoutEffect, useRef } from "preact/hooks";
import styles from "./styles.scss";
import airpods from "./airpods.svg";

let videos;

export default props => {
  const [isMuted, _setIsMuted] = useState(true);

  const stateRef = useRef(isMuted);

  const setIsMuted = data => {
    stateRef.current = data;
    _setIsMuted(data);
  };

  const init = () => {};

  const muteToggle = () => {
    videos.forEach(video => {
      video.api.setMuted(!isMuted);
    });

    setIsMuted(!isMuted);

    // videos.forEach(video => {
    //   if (video.api.isMuted()) video.api.setMuted(false);
    //   else if (!video.api.isMuted()) video.api.setMuted(true);
    // });
  };

  // This is done when element observed
  const callback = (entries, observer) => {
    entries.forEach(entry => {
      // Don't fire on load
      if (entry.intersectionRatio === 0) return;

      if (entry.isIntersecting) {
        // Get the actual video element
        const entryVid = entry.target.querySelector("video");

        // Play the video
        entry.target.api.play();

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
      } else {
        const entryVid = entry.target.querySelector("video");

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
              entry.target.api.pause();
              clearInterval(entryVid.fadeOutIntervalId);
            }
          }, interval);
        }
      }
    });
  };

  useEffect(() => {
    // Init effect run on mount
    videos = document.querySelectorAll(".VideoPlayer");

    let observer = new IntersectionObserver(callback, {
      root: null,
      rootMargin: "0px",
      threshold: 0.6
    });

    // Add video players to our observer
    videos.forEach(video => {
      observer.observe(video);

      // Initially set videos to muted, in case not ambient
      video.api.setMuted(isMuted);

      // Set volume to zero so we can fade in
      const videoEl = video.querySelector("video");
      videoEl.volume = 0.0;

      // Trick non-ambient videos into playing more
      // than 1 video at a time
      video.api.isAmbient = true;

      const eventListener = () => {
        setIsMuted(!stateRef.current);

        videos.forEach(vid => {
          if (vid.api.isMuted()) vid.api.setMuted(false);
          else if (!vid.api.isMuted()) vid.api.setMuted(true);
        });
      };

      // Make "fake-ambient" videos support mute
      const videoMuteButton = video.querySelector(".VideoControls-mute");

      videoMuteButton.addEventListener("click", eventListener);
    });

    return () => {
      videoMuteButton.removeEventListener("click", eventListener);
    };
  }, []);

  return (
    <div className={styles.root}>
      <div className={`${styles.icon}  ${!isMuted && styles.hidden}`}>
        <img src={airpods} />
      </div>

      <div className={`${styles.text} ${isMuted && styles.hidden}`}>
        KEEP SCROLLING TO READ THE STORY
      </div>

      <div className={`${styles.text} ${!isMuted && styles.hidden}`}>
        THIS STORY IS BEST EXPERIENCED WITH SOUND ON
      </div>

      {isMuted ? (
        <button id="toggle-global-audio-button" onClick={muteToggle}>
          ENABLE AUDIO
        </button>
      ) : (
        <button id="toggle-global-audio-button" onClick={muteToggle}>
          MUTE AUDIO
        </button>
      )}
    </div>
  );
};
