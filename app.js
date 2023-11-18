chrome.action.onClicked.addListener(tab => {
	chrome.scripting.executeScript({
		target: { tabId: tab.id },
		files: ['ics.deps.min.js', 'content.js']
	})
})