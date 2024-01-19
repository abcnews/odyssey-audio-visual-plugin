import acto from "@abcnews/alternating-case-to-object";
import { proxy } from "@abcnews/dev-proxy";
import { whenOdysseyLoaded } from "@abcnews/env-utils";
import { getMountValue, selectMounts } from "@abcnews/mount-utils";
import App from "./components/App";
import { h, render } from 'preact';

let appMountEl;
let appProps;
const PROJECT_NAME = "odyssey-audio-visual-plugin";

async function init() {
  await whenOdysseyLoaded;

  [appMountEl] = selectMounts("audio-visual-plugin-mount");

  if (appMountEl) {
    appProps = acto(getMountValue(appMountEl));
    render(<App {...appProps} />, appMountEl);
  }
}

proxy(PROJECT_NAME).then(init);

if (module.hot) {
  module.hot.accept("./components/App", () => {
    try {
      init();
    } catch (err) {
      import("./components/ErrorBox").then(({ default: ErrorBox }) => {
        render(<ErrorBox error={err as Error} />, appMountEl);
      });
    }
  });
}

if (process.env.NODE_ENV === "development") {
  console.debug(`[${PROJECT_NAME}] public path: ${__webpack_public_path__}`);
}