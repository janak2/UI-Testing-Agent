import "./content.styles.css";
import { Cursor } from "./Cursor";
import React from "react";
import AgentStatusContainer from "./components/AgentStatus/AgentStatusContainer";
import { render } from "react-dom";
import { StyleSheetManager } from "styled-components";
import $ from "jquery";
import { scrapeDOM } from "./modules/scraper";
import { useState, useEffect } from "react";

console.log("Content script works!");
console.log("Must reload extension for modifications to take effect.");

chrome.runtime.sendMessage({ greeting: "hello" }, function (response) {
  console.log(response.farewell);
});

$(document).ready(() => {
  scrapeDOM();
});

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
  console.log(rect);
  return {
    x: rect.x,
    y: rect.y,
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
    const clickableTags = ["a", "button", "input"];
    const isClickableTag = clickableTags.includes(tagName);
    const isClickableInput =
      tagName === "input" &&
      ["submit", "button", "reset", "image"].includes(element.type);

    const hasNonZeroCoordinates = element.getBoundingClientRect().x !== 0;

    return (
      (hasClickableRole || isClickableTag || isClickableInput) &&
      hasNonZeroCoordinates
    );
  });

  // Select a random element from the clickable elements
  const randomIndex = Math.floor(Math.random() * clickableElements.length);
  const randomClickableElement = clickableElements[randomIndex];

  return randomClickableElement;
};

const linkNode = document.createElement("link");
linkNode.type = "text/css";
linkNode.rel = "stylesheet";
linkNode.href = "//fonts.googleapis.com/css?family=Poppins";
document.head.appendChild(linkNode);

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

const Container = () => {
  const randomClickableElement = getRandomClickableElement();
  const { x, y } = getElementCoordinates(randomClickableElement);

  const [cursorX, setCursorX] = useState(x);
  const [cursorY, setCursorY] = useState(y);

  useEffect(() => {
    const randomClickableElement = getRandomClickableElement();
    const { x, y } = getElementCoordinates(randomClickableElement);
    console.log("randomClickableElement", randomClickableElement);
    console.log("x", x);
    console.log("y", y);
    setCursorX(x);
    setCursorY(y);
  }, []);

  return (
    <>
      <AgentStatusContainer />
      <Cursor name="John" x={cursorX} y={cursorY} />
    </>
  );
};

render(
  <StyleSheetManager target={styleSlot}>
    <Container />
  </StyleSheetManager>,
  renderIn
);
