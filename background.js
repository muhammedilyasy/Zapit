chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showAlert') {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: showAlertNearIcon,
      args: [message.message]
    });
  }
});

function showAlertNearIcon(message) {
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '50%';
  notification.style.left = '50%';
  notification.style.transform = 'translate(-50%, -50%)';
  notification.style.background = '#007bff';
  notification.style.color = '#fff';
  notification.style.padding = '10px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '9999';
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.remove();
  }, 3000);
}