function isStringEmpty(input)
{
	return (input == undefined || input == null || input.length === 0 || input.toString().replace(/\s/g,"") == "") ? true : false;
}

//-------------------------

chrome.runtime.onInstalled.addListener(() => {
	console.debug("pa-b : onInstalled : page analyzer extension initiated.");

	// -----

	chrome.contextMenus.create({
		id: "openAnalyzerPanel",
		title: "Analyze this page",
		contexts: ["all"]
	});
	console.debug("pa-b : onInstalled : page analyzer context menu added.");
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "openAnalyzerPanel")
	{
		(async () => {
			await chrome.sidePanel
				.setOptions({
						tabId: tab.tabId,
						path: "paPopup.html",
						enabled: true
					})
				.catch((error) => console.error(error));
		})();
		console.debug("pa-b : openAnalyzerPanel : page analyzer side panel created.");

		chrome.sidePanel.open({ tabId: tab.tabId, windowId: tab.windowId },
			() => {
				chrome.tabs.query({active: true, currentWindow: true}, 
					function(tabs){
						let activeTab = tabs[0];
						
						chrome.runtime.sendMessage({ activity: "analyzePageStarted", data: "" });
						chrome.tabs.sendMessage(activeTab.id, { activity: "analyzePage", data: {} });
				});
			});
	}
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
	const panelOptions = await chrome.sidePanel.getOptions({ tabId });
	const panelTabId = panelOptions.tabId;

	if (panelTabId === tabId)
	{
		panelOptions.enabled = true;
		chrome.sidePanel.open({ tabId: tab.tabId, windowId: tab.windowId }); //TODO : NOT WORKING
	}
	else
	{
		await chrome.sidePanel.setOptions({
			enabled: false
		});
	}
});

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		console.debug("pa-b : onMessage : request.activity <" + request.activity + ">");
		if (request.activity == "xyz")
		{
			//
		}
	}
);