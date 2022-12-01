import "intersection-observer";
import "./polyfills";
import acto from "@abcnews/alternating-case-to-object";
import { whenOdysseyLoaded } from "@abcnews/env-utils";
import { getMountValue, selectMounts } from "@abcnews/mount-utils";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";

let root;
let appProps;
const PROJECT_NAME = "odyssey-audio-visual-plugin";

async function init() {
  await whenOdysseyLoaded;

  const [appMountEl] = selectMounts("audio-visual-plugin-mount");
  console.log(appMountEl);

  if (appMountEl) {
    root = createRoot(appMountEl);
    appProps = acto(getMountValue(appMountEl));
    root.render(<App {...appProps} />);
  }
}

init();

if (module.hot) {
  module.hot.accept("./components/App", () => {
    try {
      init();
    } catch (err) {
      import("./components/ErrorBox").then(({ default: ErrorBox }) => {
        root.render(<ErrorBox error={err as Error} />);
      });
    }
  });
}

if (process.env.NODE_ENV === "development") {
  console.debug(`[${PROJECT_NAME}] public path: ${__webpack_public_path__}`);
}
