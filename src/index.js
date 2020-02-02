import "intersection-observer";
import "./polyfills";
import { h, render } from "preact";
import App from "./components/App";

const PROJECT_NAME = "odyssey-audio-visual-plugin";
const root = document.querySelector(`[data-${PROJECT_NAME}-root]`);

function init() {
  render(<App projectName={PROJECT_NAME} />, root);
}

if (window.__ODYSSEY__) {
  init(window.__ODYSSEY__);
} else {
  window.addEventListener("odyssey:api", e => {
    init(e.detail);
  });
}

if (module.hot) {
  module.hot.accept("./components/App", () => {
    try {
      init();
    } catch (err) {
      import("./components/ErrorBox").then(exports => {
        const ErrorBox = exports.default;
        render(<ErrorBox error={err} />, root);
      });
    }
  });
}

if (process.env.NODE_ENV === "development") {
  require("preact/debug");
  console.debug(`[${PROJECT_NAME}] public path: ${__webpack_public_path__}`);
}
