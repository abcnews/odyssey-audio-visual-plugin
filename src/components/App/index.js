import { h, Component } from "preact";
import { useState, useEffect } from "preact/hooks";
import styles from "./styles.scss";
import airpods from "./airpods.svg";

export default props => {
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    console.log("mounted!!!");
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
        <button
          id="toggle-global-audio-button"
          onClick={() => setIsMuted(false)}
        >
          ENABLE AUDIO
        </button>
      ) : (
        <button
          id="toggle-global-audio-button"
          onClick={() => setIsMuted(true)}
        >
          MUTE AUDIO
        </button>
      )}
    </div>
  );
};
