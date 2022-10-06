import "intersection-observer";
import "./polyfills";
import acto from '@abcnews/alternating-case-to-object';
import { whenOdysseyLoaded } from '@abcnews/env-utils';
import { getMountValue, selectMounts } from '@abcnews/mount-utils';
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";

let root;
let appProps;
const PROJECT_NAME = "odyssey-audio-visual-plugin";

function renderApp() {
  root.render(<App {...appProps} />);
}

function init() {
  const [appMountEl] = selectMounts("audio-visual-plugin-mount");

  if (appMountEl) {
    root = createRoot(appMountEl);
    appProps = acto(getMountValue(appMountEl));
    renderApp();
  }
}

whenOdysseyLoaded.then(() => init());

// Wait for Odyssey to load first
// if (window.__ODYSSEY__) {
//   init(window.__ODYSSEY__);
// } else {
//   window.addEventListener("odyssey:api", (e) => {
//     init(e.detail);
//   });
// }

if (module.hot) {
  module.hot.accept('./components/App', () => {
    try {
      init();
    } catch (err) {
      import('./components/ErrorBox').then(({ default: ErrorBox }) => {
        root.render(<ErrorBox error={err} />);
      });
    }
  });
}

if (process.env.NODE_ENV === "development") {
  console.debug(`[${PROJECT_NAME}] public path: ${__webpack_public_path__}`);
}
