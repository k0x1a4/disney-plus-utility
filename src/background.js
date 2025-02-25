let sleepTimerCountdown = null;
let sleepTimerInterval = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "startSleepTimer") {
    sleepTimerCountdown = parseInt(message.delayInSeconds, 10);
    if (sleepTimerInterval) {
      clearInterval(sleepTimerInterval);
    }
    sleepTimerInterval = setInterval(() => {
      sleepTimerCountdown--;
      chrome.runtime.sendMessage(
        { action: "updateCountdown", countdown: sleepTimerCountdown },
        (response) => {
          if (chrome.runtime.lastError) {
            // Popup might be closed, this is expected
          }
        }
      );

      if (sleepTimerCountdown <= 0) {
        clearInterval(sleepTimerInterval);
        sleepTimerInterval = null;
        sleepTimerCountdown = null;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs.length) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: () => {
                function deepQuerySelector(selector, root = document) {
                  const found = root.querySelector(selector);
                  if (found) return found;
                  const children = root.querySelectorAll("*");
                  for (let child of children) {
                    if (child.shadowRoot) {
                      const result = deepQuerySelector(
                        selector,
                        child.shadowRoot
                      );
                      if (result) return result;
                    }
                  }
                  return null;
                }

                const pauseButton = deepQuerySelector(".pause-button");
                if (pauseButton) {
                  pauseButton.click();
                } else {
                  console.error(`${PREFIX} Pause button not found.`);
                }
              },
              world: "MAIN",
            });

            chrome.storage.sync.set({ sleepTimerEnabled: false }, () => {
              chrome.runtime.sendMessage(
                { action: "sleepTimerOff" },
                (response) => {
                  if (chrome.runtime.lastError) {
                    // Popup might be closed, this is expected
                  }
                }
              );
            });
          }
        });
      }
    }, 1000);
  } else if (message.action === "stopSleepTimer") {
    if (sleepTimerInterval) {
      clearInterval(sleepTimerInterval);
      sleepTimerInterval = null;
      sleepTimerCountdown = null;
      chrome.runtime.sendMessage(
        { action: "updateCountdown", countdown: null },
        (response) => {
          if (chrome.runtime.lastError) {
            // Popup might be closed, this is expected
          }
        }
      );
    }
  } else if (message.action === "getCountdown") {
    sendResponse({ countdown: sleepTimerCountdown });
  }
});
