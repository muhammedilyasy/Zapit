document.addEventListener("DOMContentLoaded", () => {
    const backButton = document.getElementById("backButton");
    const homeButton = document.getElementById("homeButton");
    const searchInput = document.getElementById("searchInput");
    const zapList = document.getElementById("zapList");
    const noZapsMessage = document.getElementById("noZapsMessage");
  
    const urlParams = new URLSearchParams(window.location.search);
    const websiteUrl = decodeURIComponent(urlParams.get("url"));
  
    let zapsData = [];
  
    // Fetch zaps for the website
    chrome.storage.local.get([websiteUrl], (data) => {
      zapsData = data[websiteUrl] || [];
      document.getElementById("pageTitle").textContent = `Zaps for ${websiteUrl}`;
      displayZaps(zapsData);
    });
  
    // Display zaps
    function displayZaps(filteredZaps) {
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
      zapsData.splice(index, 1);
      chrome.storage.local.set({ [websiteUrl]: zapsData }, () => {
        displayZaps(zapsData);
      });
    }
  
    // Search functionality
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filteredZaps = zapsData.filter(({ name, selector }) =>
        name.toLowerCase().includes(query) || selector.toLowerCase().includes(query)
      );
      displayZaps(filteredZaps);
    });
  
    // Back button functionality
    backButton.addEventListener("click", () => {
      window.location.href = "options.html"; // Navigate back to options page
    });
  
    // Back to Home Button
    homeButton.addEventListener("click", () => {
      // Redirect to the extension's homepage or documentation
      window.location.href = "https://ilyasy.com"; // Replace with your actual homepage URL
    });
  });