import { h, Component } from "preact";
import { useState, useEffect } from "preact/hooks";
import styles from "./styles.scss";
import airpods from "./airpods.svg";

let videos;

export default props => {
  const [isMuted, setIsMuted] = useState(true);

  const init = () => {
    videos = document.querySelectorAll(".VideoPlayer");

    let observer = new IntersectionObserver(callback, {
      root: null,
      rootMargin: "0px",
      threshold: 0.6
    });

    // Add video players to our observer
    videos.forEach(video => {
      observer.observe(video);
    });
  };

  const muteToggle = () => {
    setIsMuted(!isMuted);

    videos.forEach(video => {
      if (video.api.isMuted()) video.api.setMuted(false);
      else if (!video.api.isMuted()) video.api.setMuted(true);
    });
  };

  useEffect(() => {
    init();
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

// This is done when element observed
function callback(entries, observer) {
  entries.forEach(entry => {
    // Don't fire on load
    if (entry.intersectionRatio === 0) return;

    if (entry.isIntersecting) {
      // Get the actual video element
      const entryVid = entry.target.querySelector("video");

      // If we're already fading out, then stop
      clearInterval(entryVid.fadeOutIntervalId);

      if (entryVid.volume < 1.0) {
        // entryVid.volume = 1.0;
        let vol = entryVid.volume;
        let interval = 200;

        entryVid.fadeInIntervalId = setInterval(function() {
          // Reduce volume by 0.05 as long as it is above 0
          // This works as long as you start with a multiple of 0.05!
          if (vol < 1.0) {
            vol += 0.4;
            if (vol > 1.0) vol = 1.0;
            // limit to 2 decimal places
            // also converts to string, works ok
            entryVid.volume = vol.toFixed(2);
          } else {
            // Stop the setInterval when 0 is reached
            clearInterval(entryVid.fadeInIntervalId);
          }
        }, interval);
      }

      // Play the video
      entry.target.api.play();
    } else {
      const entryVid = entry.target.querySelector("video");

      // If we're already fading in, then stop
      clearInterval(entryVid.fadeInIntervalId);

      let vol = entryVid.volume;
      let interval = 200;

      entryVid.fadeOutIntervalId = setInterval(function() {
        // Reduce volume by 0.05 as long as it is above 0
        // This works as long as you start with a multiple of 0.05!
        if (vol > 0) {
          vol -= 0.1;
          if (vol < 0.0) vol = 0.0;
          // limit to 2 decimal places
          // also converts to string, works ok
          entryVid.volume = vol.toFixed(2);
        } else {
          // Stop the setInterval when 0 is reached
          entry.target.api.pause();
          clearInterval(entryVid.fadeOutIntervalId);
        }
      }, interval);
    }
  });
}
