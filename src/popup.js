document.addEventListener("DOMContentLoaded", () => {
  const autoSkipToggle = document.getElementById("toggleAutoSkip");
  const sleepTimerToggle = document.getElementById("toggleSleepTimer");
  const sleepTimerDelayInputs = document.getElementsByName("sleepTimerDelay");
  const countdownSection = document.getElementById("countdownSection");
  const sleepCountdownEl = document.getElementById("sleepCountdown");

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  }

  function updateSleepTimerUI(isEnabled) {
    countdownSection.style.display = isEnabled ? "flex" : "none";
    sleepCountdownEl.textContent = "";
    if (isEnabled) {
      getCountdown();
    }
  }

  function getCountdown() {
    chrome.runtime.sendMessage({ action: "getCountdown" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(`Error getting countdown: ${chrome.runtime.lastError.message}`);
        return;
      }
      if (response && response.countdown !== null) {
        sleepCountdownEl.textContent = formatTime(response.countdown);
      }
    });
  }

  chrome.storage.sync.get(
    ["autoSkipEnabled", "sleepTimerEnabled", "sleepTimerDelay"],
    (data) => {
      autoSkipToggle.checked = data.autoSkipEnabled !== false;
      sleepTimerToggle.checked = data.sleepTimerEnabled === true;
      const delay = data.sleepTimerDelay || "60";
      sleepTimerDelayInputs.forEach((input) => {
        input.checked = input.value === delay;
      });

      updateSleepTimerUI(sleepTimerToggle.checked);
    }
  );

  // Toggle auto skip
  autoSkipToggle.addEventListener("change", () => {
    chrome.storage.sync.set({ autoSkipEnabled: autoSkipToggle.checked });
  });

  // Toggle sleep timer
  sleepTimerToggle.addEventListener("change", () => {
    const isEnabled = sleepTimerToggle.checked;
    chrome.storage.sync.set({ sleepTimerEnabled: isEnabled });

    if (isEnabled) {
      const selected = Array.from(sleepTimerDelayInputs).find(
        (input) => input.checked
      );
      const delay = selected ? selected.value : "60";
      const delayInSeconds = parseInt(delay, 10) * 60;
      chrome.runtime.sendMessage({ action: "startSleepTimer", delayInSeconds });
    } else {
      chrome.runtime.sendMessage({ action: "stopSleepTimer" });
    }

    updateSleepTimerUI(isEnabled);
  });

  // Sleep timer delay input
  sleepTimerDelayInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        const delay = input.value;
        chrome.storage.sync.set({ sleepTimerDelay: delay }, () => {
          console.log(`Sleep timer delay updated to: ${delay}`);
          if (sleepTimerToggle.checked) {
            chrome.runtime.sendMessage({ action: "stopSleepTimer" }, () => {
              const delayInSeconds = parseInt(delay, 10) * 60;
              chrome.runtime.sendMessage({ action: "startSleepTimer", delayInSeconds });
              updateSleepTimerUI(true);
            });
          }
        });
      }
    });
  });

  chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.action === "updateCountdown") {
      if (message.countdown !== null) {
        sleepCountdownEl.textContent = formatTime(message.countdown);
      } else {
        sleepCountdownEl.textContent = "";
      }
    } else if (message.action === "sleepTimerOff") {
      sleepTimerToggle.checked = false;
      updateSleepTimerUI(false);
    }
  });
});