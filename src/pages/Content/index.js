import { printLine } from "./modules/print";
import "./content.styles.css";
import { Cursor } from "./Cursor";
import React, { useEffect, useState } from "react";
import AgentStatusContainer, {
  sampleAgent,
} from "./components/AgentStatus/AgentStatusContainer";
import { render } from "react-dom";
import { StyleSheetManager } from "styled-components";
import $ from "jquery";
import { scrapeDOM } from "./modules/scraper";

console.log("Content script works!");
console.log("Must reload extension for modifications to take effect.");

function requestFeedback(persona, domSummary, setQuip) {
  console.log("sending request");
  chrome.runtime.sendMessage(
    {
      type: "getFeedback",
      persona: persona,
      domSummary: domSummary,
    },
    (response) => {
      // handle the response here
      console.log(response);
      setQuip(response);
    }
  );
}

$(document).ready(() => {
  console.log("starting scrape");
  requestFeedback("angry Steve Jobs", scrapeDOM());
});

printLine("Using the 'printLine' function from the Print Module");

const body = document.querySelector("body");
const app = document.createElement("div");
app.style.cssText =
  "z-index:10000;position:fixed;bottom:16px;width:100%;display:flex;justify-content:center;";

app.id = "react-root";

if (body) {
  body.prepend(app);
}

const getElementCoordinates = (element) => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
};

const getRandomClickableElement = () => {
  // Get all elements in the DOM
  const allElements = document.getElementsByTagName("*");

  // Filter clickable elements
  const clickableElements = [].filter.call(allElements, (element) => {
    const tagName = element.tagName.toLowerCase();
    const hasClickableRole =
      element.getAttribute("role") === "button" ||
      element.getAttribute("role") === "link";
    const clickableTags = ["a", "button"];
    const isClickableTag = clickableTags.includes(tagName);
    const isClickableInput =
      tagName === "input" &&
      ["submit", "button", "reset", "image"].includes(element.type);

    const isNotAtOrigin =
      element.getBoundingClientRect().x !== 0 &&
      element.getBoundingClientRect().y !== 0;

    const hasDomain =
      !element.href || element.href.includes(window.location.hostname);
    return (hasClickableRole || isClickableTag) && isNotAtOrigin && hasDomain;
  });

  // Select a random element from the clickable elements
  const randomIndex = Math.floor(Math.random() * clickableElements.length);
  const randomClickableElement = clickableElements[randomIndex];

  return randomClickableElement;
};

// FOR SHADOW-DOM IMPLEMENTATION
const Poppins = document.createElement("link");
Poppins.type = "text/css";
Poppins.rel = "stylesheet";
Poppins.href = "//fonts.googleapis.com/css?family=Poppins";
document.head.appendChild(Poppins);

const container = document.getElementById("react-root");
// const root = createRoot(container);

const host = document.querySelector("#react-root");
const shadow = host.attachShadow({ mode: "open" });

// create a slot where we will attach the StyleSheetManager
const styleSlot = document.createElement("section");
// append the styleSlot inside the shadow
shadow.appendChild(styleSlot);

// create the element where we would render our app
const renderIn = document.createElement("div");
// append the renderIn element inside the styleSlot
styleSlot.appendChild(renderIn);

const App = () => {
  const [position, setPosition] = React.useState({
    x: window.innerWidth * 0.4,
    y: window.innerHeight * 0.3,
  });
  const [cursorTimeout, setCursorTimeout] = React.useState(50000);
  const [cursorClicked, setCursorClicked] = React.useState(false);
  const [wasclicked, setWasclicked] = useState(false);
  const [quip, setQuip] = useState("");

  React.useEffect(() => {
    console.log("starting scrape");
    requestFeedback("angry Steve Jobs", scrapeDOM(), setQuip);
  }, []);

  React.useEffect(() => {
    const simulateClick = async () => {
      setupListeners(setQuip);
      const nextElement = getRandomClickableElement();
      console.log(nextElement);
      const nextPosition = getElementCoordinates(nextElement);
      console.log(nextElement.getBoundingClientRect());
      console.log(nextElement, nextPosition);
      if (nextPosition.y >= window.innerHeight) {
        // Scrolling the page itself
        window.scrollTo({
          top: nextPosition.y - window.innerHeight / 2 + 180,
          behavior: "smooth",
        });
        // setPosition({ x: position.x + 320, y: position.y + 120 });
        // Set the cursor position relative to the window
        setTimeout(() => {
          // console.log("y scroll by: ", window.scrollY);
          // console.log("x scroll by: ", window.scrollX);
          const newPos = {
            x: nextPosition.x,
            y: nextPosition.y - window.scrollY,
          };
          setPosition(newPos);
        }, 700);
      } else {
        setPosition(nextPosition);
      }
      setTimeout(() => {
        setCursorClicked(true);
      }, 1000);
      setTimeout(() => {
        nextElement.click();
        setWasclicked(false);
        setCursorClicked(false);
      }, 1500);
    };
    if (wasclicked) {
      simulateClick();
    }
  }, [wasclicked]);
  return (
    <>
      <AgentStatusContainer
        wasclicked={wasclicked}
        setWasclicked={setWasclicked}
        quip={quip}
      />
      <Cursor name="Steve" position={position} clicked={cursorClicked} />
    </>
  );
};

render(
  <StyleSheetManager target={styleSlot}>
    <App />
  </StyleSheetManager>,
  renderIn
);

function setupListeners(setQuip) {
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type === "getContent") {
      console.log("scraping dom for popup");
      sendResponse(scrapeDOM());
    } else if (msg.type === "updateQuip") {
      setQuip(msg.quip);
    } else {
      console.log("unexpected expected message: " + JSON.stringify(msg));
    }
  });
}

console.log("done setting up content");
