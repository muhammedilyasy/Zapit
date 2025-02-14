// content.js

let zappingActive = false;

// Restore hidden elements when the page loads
function restoreHiddenElements() {
  const url = window.location.href;
  chrome.storage.local.get([url], (data) => {
    const zaps = data[url] || [];
    zaps.forEach((zap) => {
      const element = document.querySelector(zap.selector);
      if (element) {
        hideElement(element);
      }
    });
  });
}

// Call restoreHiddenElements when the script is first loaded
restoreHiddenElements();

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script:", message); // Debugging log
  if (message.action === "toggleZapping") {
    // Toggle Zapping state
    zappingActive = !zappingActive;

    // Perform actions based on the Zapping state
    if (zappingActive) {
      console.log("Zapping Enabled");
      document.body.classList.add("zapping-active");

      // Add event listeners for Zapping mode
      document.addEventListener("mouseover", handleMouseOver);
      document.addEventListener("mouseout", handleMouseOut);
      document.addEventListener("click", handleElementClick);
    } else {
      console.log("Zapping Disabled");
      document.body.classList.remove("zapping-active");

      // Remove event listeners when Zapping is disabled
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("click", handleElementClick);
    }

    // Send a response back to the popup
    sendResponse({ zappingActive });
  }
});

// Handle mouse over
function handleMouseOver(event) {
  const target = event.target;
  if (zappingActive) {
    console.log("Mouse over element:", target); // Debugging log
    target.style.outline = "3px solid blue";
    target.style.outlineOffset = "2px";
  }
}

// Handle mouse out
function handleMouseOut(event) {
  const target = event.target;
  if (zappingActive) {
    console.log("Mouse out of element:", target); // Debugging log
    target.style.outline = ""; // Remove the outline
    target.style.outlineOffset = "";
  }
}

// Handle element click
function handleElementClick(event) {
  if (zappingActive) {
    console.log("Element clicked:", event.target); // Debugging log
    event.preventDefault();
    event.stopPropagation();

    const target = event.target;
    hideElement(target);

    // Check if "Remember this Zap" is enabled
    chrome.storage.local.get('rememberZap', (data) => {
      if (data.rememberZap) {
        const selector = getSelector(target);
        const name = prompt("Name this zap (optional):");
        saveZap(selector, name); // Save the zap
      }
    });
  }
}

// Function to hide an element
function hideElement(element) {
  console.log("Hiding element:", element); // Debugging line
  element.style.transition = "transform 0.3s ease, opacity 0.3s ease";
  element.style.transform = "scale(1.2)";
  element.style.opacity = "0";
  setTimeout(() => {
    element.style.display = "none";
  }, 300);
}

// Function to get a unique CSS selector for an element
function getSelector(element) {
  if (!element) return null;
  const path = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();
    if (element.id) {
      selector += `#${element.id}`;
      path.unshift(selector);
      break;
    } else {
      let sibling = element;
      let nth = 1;
      while (sibling.previousElementSibling) {
        sibling = sibling.previousElementSibling;
        if (sibling.nodeName.toLowerCase() === selector) nth++;
      }
      if (nth !== 1) selector += `:nth-of-type(${nth})`;
    }
    path.unshift(selector);
    element = element.parentNode;
  }
  return path.join(' > ');
}

// Function to save a zap
function saveZap(selector, name) {
  const url = window.location.href;
  chrome.storage.local.get([url], (result) => {
    const zaps = result[url] || [];
    const existingZap = zaps.find(zap => zap.selector === selector);
    if (!existingZap) {
      zaps.push({ selector, name: name || "Unnamed Zap" });
      chrome.storage.local.set({ [url]: zaps }, () => {
        console.log(`Saved zap: ${selector}`);
      });
    } else {
      console.log("Zap already exists for this element.");
    }
  });
}