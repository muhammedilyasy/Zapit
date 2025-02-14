document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById('toggleButton');
  const rememberZapCheckbox = document.getElementById('rememberZap');
  const currentWebsiteZapsButton = document.getElementById('currentWebsiteZaps');
  const allZapsButton = document.getElementById('allZaps');
  const homeLink = document.getElementById('homeLink');
  const homeLinkImportExport = document.getElementById('homeLinkImportExport');
  const importExportPageButton = document.getElementById('importExportPageButton');
  const exportAllZapsButton = document.getElementById('exportAllZaps');
  const importAllZapsButton = document.getElementById('importAllZaps');
  const mainSection = document.getElementById('mainSection');
  const innerPagesSection = document.getElementById('innerPagesSection');
  const importExportSection = document.getElementById('importExportSection');
  const searchInput = document.getElementById('searchInput');
  const websiteList = document.getElementById('websiteList');
  const zapList = document.getElementById('zapList');
  const noZapsMessage = document.getElementById('noZapsMessage');

  let websitesData = [];
  let zapsData = [];
  let currentView = "main"; // Tracks the current view ("main", "allZaps", "currentWebsite", "importExport")
  let websiteUrl = null; // Store the current website URL globally

  // Load the state of "Remember this Zap" checkbox
  chrome.storage.local.get('rememberZap', (data) => {
    rememberZapCheckbox.checked = data.rememberZap || false;
  });

  // Save the state of "Remember this Zap" checkbox when changed
  rememberZapCheckbox.addEventListener('change', () => {
    const isChecked = rememberZapCheckbox.checked;
    chrome.storage.local.set({ rememberZap: isChecked }, () => {
      console.log(`Remember Zap set to: ${isChecked}`);
    });
  });

  // Load the state of Zapping
  chrome.storage.local.get('zappingActive', (data) => {
    const zappingActive = data.zappingActive || false;
    updateButtonTextAndBadge(zappingActive);
  });

  // Toggle Zapping
  toggleButton.addEventListener('click', () => {
    console.log("Toggle Zapping button clicked."); // Debugging log
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      console.log("Sending toggleZapping message to tab:", activeTab.id); // Debugging log
      sendMessageToContentScript(activeTab.id, { action: "toggleZapping" });
    });
  });

  // Helper function to send message to content script
  function sendMessageToContentScript(tabId, message) {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message to content script:", chrome.runtime.lastError.message);

        // Inject content script dynamically if it's not already loaded
        chrome.scripting.executeScript(
          { target: { tabId: tabId }, files: ["content.js"] },
          () => {
            if (chrome.runtime.lastError) {
              console.error("Failed to inject content script:", chrome.runtime.lastError.message);
              alert("Failed to enable Zapping. Please reload the page and try again.");
              return;
            }

            // Retry sending the message after injecting the script
            chrome.tabs.sendMessage(tabId, message, (retryResponse) => {
              if (chrome.runtime.lastError) {
                console.error("Retry failed:", chrome.runtime.lastError.message);
                alert("Failed to communicate with the content script. Please reload the page.");
              } else if (retryResponse && retryResponse.zappingActive !== undefined) {
                updateButtonTextAndBadge(retryResponse.zappingActive);
              } else {
                console.error("Content script response is undefined.");
                alert("Unexpected error. Please reload the page.");
              }
            });
          }
        );
      } else if (response && response.zappingActive !== undefined) {
        updateButtonTextAndBadge(response.zappingActive);
      } else {
        console.error("Content script response is undefined.");
        alert("Unexpected error. Please reload the page.");
      }
    });
  }

  // Update the button text and badge based on Zapping state
  function updateButtonTextAndBadge(zappingActive) {
    toggleButton.innerText = zappingActive ? "Disable Zapping" : "Enable Zapping";
    chrome.storage.local.set({ zappingActive: zappingActive });

    // Update the badge text and color
    const badgeText = zappingActive ? "ON" : "OFF";
    const badgeColor = zappingActive ? "#007bff" : "#f44336"; // Blue for ON, Red for OFF
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  }

  // Open options page with current website zaps
  currentWebsiteZapsButton.addEventListener('click', () => {
    console.log("Current Website Zaps button clicked."); // Debugging log
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0].url;
      websiteUrl = decodeURIComponent(url); // Set the global websiteUrl
      loadZapsForCurrentWebsite(websiteUrl);
      switchToInnerPage("currentWebsite");
    });
  });

  // Open options page with all zaps
  allZapsButton.addEventListener('click', () => {
    console.log("All Zaps button clicked."); // Debugging log
    loadAllZaps();
    switchToInnerPage("allZaps");
  });

  // Open Import/Export Page
  importExportPageButton.addEventListener('click', () => {
    switchToImportExportPage();
  });

  // Back to Home Links
  homeLink.addEventListener("click", () => {
    switchToMainSection();
  });
  homeLinkImportExport.addEventListener("click", () => {
    switchToMainSection();
  });

  // Switch to Inner Pages Section
  function switchToInnerPage(view) {
    currentView = view;
    mainSection.classList.add("hidden");
    innerPagesSection.classList.remove("hidden");
    importExportSection.classList.add("hidden");
  }

  // Switch to Import/Export Page
  function switchToImportExportPage() {
    currentView = "importExport";
    mainSection.classList.add("hidden");
    innerPagesSection.classList.add("hidden");
    importExportSection.classList.remove("hidden");
  }

  // Switch to Main Section
  function switchToMainSection() {
    currentView = "main";
    mainSection.classList.remove("hidden");
    innerPagesSection.classList.add("hidden");
    importExportSection.classList.add("hidden");
  }

  // Load zaps for the current website
  function loadZapsForCurrentWebsite(url) {
    chrome.storage.local.get([url], (data) => {
      zapsData = data[url] || [];
      document.getElementById("pageTitle").textContent = `Zaps for ${url}`;
      displayZaps(zapsData);
    });
  }

  // Load all zaps
  function loadAllZaps() {
    chrome.storage.local.get(null, (data) => {
      // Filter websites to include only those with saved zaps
      const websites = Object.keys(data)
        .filter(key => key.startsWith("http") && Array.isArray(data[key]) && data[key].length > 0);

      if (websites.length === 0) {
        noZapsMessage.textContent = "No zaps found.";
        return;
      }

      // Map filtered websites to their zap data
      websitesData = websites.map(url => ({ url, zaps: data[url] }));
      document.getElementById("pageTitle").textContent = "All Saved Zaps";
      displayWebsites(websitesData);
    });
  }

  // Display websites
  function displayWebsites(filteredWebsites) {
    websiteList.innerHTML = "";
    zapList.innerHTML = ""; // Clear zap list
    if (filteredWebsites.length === 0) {
      noZapsMessage.textContent = "No matching websites found.";
      return;
    }

    filteredWebsites.forEach(({ url, zaps }) => {
      const websiteItem = document.createElement("li");
      websiteItem.className = "website-item";

      // Favicon
      const favicon = document.createElement("img");
      favicon.className = "favicon";
      favicon.src = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`;
      favicon.alt = "Favicon";

      // Website Name
      const websiteName = document.createElement("span");
      websiteName.className = "website-name";
      websiteName.textContent = url;

      // Append favicon and name to the item
      websiteItem.appendChild(favicon);
      websiteItem.appendChild(websiteName);

      // Navigate to zaps for this website
      websiteItem.addEventListener("click", () => {
        websiteUrl = url; // Set the global websiteUrl
        loadZapsForCurrentWebsite(url);
        switchToInnerPage("currentWebsite");
      });

      websiteList.appendChild(websiteItem);
    });
  }

  // Display zaps
  function displayZaps(filteredZaps) {
    websiteList.innerHTML = ""; // Clear website list
    zapList.innerHTML = "";
    if (filteredZaps.length === 0) {
      noZapsMessage.textContent = "No matching zaps found.";
      return;
    }

    filteredZaps.forEach((zap, index) => {
      const zapItem = document.createElement("li");
      zapItem.className = "zap-item";

      const zapName = document.createElement("span");
      zapName.textContent = `${zap.name} (${zap.selector})`;

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.onclick = () => deleteZap(index);

      zapItem.appendChild(zapName);
      zapItem.appendChild(deleteButton);
      zapList.appendChild(zapItem);
    });
  }

  // Delete a zap
  function deleteZap(index) {
    if (!websiteUrl) {
      console.error("Website URL is not defined.");
      return;
    }

    zapsData.splice(index, 1);
    chrome.storage.local.set({ [websiteUrl]: zapsData }, () => {
      displayZaps(zapsData);
    });
  }

  // Export All Zaps
  exportAllZapsButton.addEventListener("click", () => {
    chrome.storage.local.get(null, (data) => {
      const exportData = {};
      Object.keys(data).forEach((key) => {
        if (key.startsWith("http")) {
          exportData[key] = data[key];
        }
      });
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zaps-export.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Import All Zaps
  importAllZapsButton.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target.result);
            chrome.storage.local.set(importedData, () => {
              alert("Zaps imported successfully!");
              loadAllZaps(); // Refresh the UI
            });
          } catch (error) {
            alert("Invalid file format. Please upload a valid JSON file.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  });

  // Search functionality
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    if (currentView === "allZaps") {
      const filteredWebsites = websitesData.filter(({ url }) =>
        url.toLowerCase().includes(query)
      );
      displayWebsites(filteredWebsites);
    } else if (currentView === "currentWebsite") {
      const filteredZaps = zapsData.filter(({ name, selector }) =>
        name.toLowerCase().includes(query) || selector.toLowerCase().includes(query)
      );
      displayZaps(filteredZaps);
    }
  });
});