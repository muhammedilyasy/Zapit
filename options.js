document.addEventListener("DOMContentLoaded", () => {
    const homeButton = document.getElementById("homeButton");
    const searchInput = document.getElementById("searchInput");
    const websiteList = document.getElementById("websiteList");
    const noZapsMessage = document.getElementById("noZapsMessage");
  
    let websitesData = [];
  
    // Load all zaps
    chrome.storage.local.get(null, (data) => {
      const websites = Object.keys(data).filter(key => key.startsWith("http"));
      if (websites.length === 0) {
        noZapsMessage.textContent = "No zaps found.";
        return;
      }
  
      websitesData = websites.map(url => ({
        url,
        zaps: data[url]
      }));
  
      displayWebsites(websitesData);
    });
  
    // Display websites
    function displayWebsites(filteredWebsites) {
      websiteList.innerHTML = "";
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
  
        // Navigate to inner page
        websiteItem.addEventListener("click", () => {
          window.location.href = `inner.html?url=${encodeURIComponent(url)}`;
        });
  
        websiteList.appendChild(websiteItem);
      });
    }
  
    // Search functionality
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filteredWebsites = websitesData.filter(({ url }) =>
        url.toLowerCase().includes(query)
      );
      displayWebsites(filteredWebsites);
    });
  
    // Back to Home Button
    homeButton.addEventListener("click", () => {
      // Redirect to the extension's homepage or documentation
      window.location.href = "https://ilyasy.com"; // Replace with your actual homepage URL
    });
  });