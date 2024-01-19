// How many seconds before we unload videos
const SECONDS_BEFORE_UNLOAD = 30;

function playVideo(video) {
  if (video.api) {
    return video.api.play();
  } else {
    return video.play();
  }
}

function getIsPaused(video) {
  if (video.api) {
    return video.api.isPaused();
  } else {
    return getVideoEl(video).paused;
  }
}

export function getIsMuted(video) {
  if (video.api) {
    return video.api.isMuted();
  } else {
    return !!getVideoEl(video).muted;
  }
}

export function pauseVideo(video) {
  if (video.api) {
    video.api.pause();
  } else {
    getVideoEl(video).pause();
  }
}

export const getVideoEl = (video) => {
  if (video.tagName === 'VIDEO') {
    return video;
  } else {
    return video.querySelector("video")
  }
}

export function setMuted(video, isMuted) {
  if (video.api) {
    video.api.setMuted(isMuted);
  } else {
    getVideoEl(video).muted = isMuted;
  }
}

export const fadeInVideoEl = videoPlayer => {
  // Get the actual video element
  const videoEl = getVideoEl(videoPlayer);

  // If video has been unloaded we need to load it up again
  if (typeof videoEl.dataset.src !== "undefined") {
    videoEl.src = videoEl.dataset.src;
    videoEl.load();
    videoEl.removeAttribute("data-src");
  }

  // If we're set to unload, don't do it
  clearTimeout(videoEl.unloaderId);
  // If we're already fading out, then stop
  clearInterval(videoEl.fadeOutIntervalId);

  // Play the video
  if (getIsPaused(videoPlayer)) playVideo(videoPlayer);

  // Fade in
  if (videoEl.volume < 1.0) {
    let vol = videoEl.volume;
    const interval = 200;

    videoEl.fadeInIntervalId = setInterval(function () {
      // Reduce volume as long as it is above 0
      if (vol < 1.0) {
        vol += 0.4;
        if (vol > 1.0) vol = 1.0;
        videoEl.volume = vol.toFixed(2);
      } else {
        // Stop the setInterval when 0 is reached
        clearInterval(videoEl.fadeInIntervalId);
      }
    }, interval);
  }
};

export const fadeOutVideoEl = videoPlayer => {
  const videoEl = getVideoEl(videoPlayer);

  // If we're already fading in, then stop
  clearInterval(videoEl.fadeInIntervalId);

  if (videoEl.volume > 0.0) {
    let vol = videoEl.volume;
    const interval = 200;

    videoEl.fadeOutIntervalId = setInterval(function () {
      // Reduce volume as long as it is above 0
      if (vol > 0) {
        vol -= 0.1;
        if (vol < 0.0) vol = 0.0;
        videoEl.volume = vol.toFixed(2);
      } else {
        // Stop the setInterval when 0 is reached
        pauseVideo(videoPlayer);
        clearInterval(videoEl.fadeOutIntervalId);

        // After a long while not playing we unload the vids
        videoEl.unloaderId = setTimeout(() => {
          videoEl.dataset.src = videoEl.src;
          videoEl.removeAttribute("src"); // empty source
          videoEl.load();
        }, SECONDS_BEFORE_UNLOAD * 1000);
      }
    }, interval);
  }
};