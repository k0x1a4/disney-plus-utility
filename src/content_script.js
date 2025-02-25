const skipIntroButtonSelector = ".skip__button";
const nextEpisodeButtonSelector = "[data-testid='icon-restart']";

function clickSkipIntroButton() {
    const skipIntroButton = document.querySelector(skipIntroButtonSelector);
    if (skipIntroButton) {
        skipIntroButton.click();
    }
}

function clickNextEpisodeButton() {
  const svgElement = document.querySelector(nextEpisodeButtonSelector);
  if (svgElement) {
    const nextEpisodeButton = svgElement.closest("button");
    if (nextEpisodeButton) {
      nextEpisodeButton.click();
    }
  }
}

clickSkipIntroButton();
clickNextEpisodeButton();

const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
			clickSkipIntroButton();
			clickNextEpisodeButton();
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});