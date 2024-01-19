# Odyssey Audio Visual Plugin

A plugin for ABC's [Odyssey](https://github.com/abcnews/odyssey) Story Format that asks for user permission to play audio.

After the user gives permission, videos will automatically play and audio will fade between the videos as the page scrolls.

![The plugin shows a message "this story is best experienced with sound on", and an "enable audio" button](example.webp)

Originally developed for the 4 Corners [Black Summer](https://www.abc.net.au/news/2020-02-03/inside-the-australian-bushfires-crisis/11890458?nw=0&r=HtmlFragment) bushfires interactive.

## Usage

This plugin depends on [Odyssey](https://github.com/abcnews/odyssey).

### Add the plugin
The plugin works out of the box with standard Odyssey videos.

1. Add the `odyssey-audio-visual-plugin` JavaScript to your article in CoreMedia (content id: 101718598).
2. Add `#audio-visual-plugin-mount` on its own line where you want the "enable audio" button to appear.

This should get you most of the way there.

### Opt in non-Odyssey `<video>` elements

Custom interactives like Ease Frame must opt in to allow the Odyssey Audio Visual Plugin to control the volume.

To do this:

1. Add `class="oavp-video"` to a _parent_ element for the `<video>`.
2. Each `<video>` needs its own parent element.


### Integrate via API

The browser may permit playing audio even if the user hasn't explicitly given permission, so to be a good citizen you should check the current status before playing any audio.

There is a DOM-based API to check the current permission:

```js
const isMuted = document.querySelector('[data-id="odyssey-audio-visual-plugin"')?.dataset?.muted !== 'false';
```

Note that if the plugin doesn't exist in the page, this code will always return false.


## Authors

- Joshua Byrd ([phocks@gmail.com](mailto:phocks@gmail.com))
- Ash Kyd ([ash@kyd.com.au](mailto:ash@kyd.com.au))
