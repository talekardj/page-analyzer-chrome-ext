const debugHeaders = {
				"X-NV-Debug" : "1"
			};
const domainHostRegex = /^https:\/\/([^\/]+)\/.*/i;
const imageRequestRegex = /.+\.(jpg|jpeg|png|gif|svg|webp|avif|bmp|ico).*/i;
const timeoutMsec = 10000;

function isStringEmpty(input)
{
	return (input == undefined || input == null || input.length === 0 || input.toString().replace(/\s/g,"") == "") ? true : false;
}

function timeout(msecs, promise)
{
	//https://stackoverflow.com/questions/46946380/fetch-api-request-timeout
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error("Request timed out"));
		}, msecs);

		promise.then(value => {
			clearTimeout(timer);
			resolve(value);
		})
		.catch(reason => {
			clearTimeout(timer);
			reject(reason);
		})
	});
}

function getDefaultAnalysisObject()
{
	return {
		observation: "",
		suggestions: []
	};
}

function getDefaultResponseObject(request, response)
{
	return {
		isError: false,
		message: "success", 
		responseStatus : {
			url: "",
			httpStatus: ""
		},
		pageContents : {
			pageSize: -1,
			dnsPrefetches: [],
			preconnects: [],
			preloads: [],
			scripts: [],
			stylesheets: [],
			images: [],
			fonts: []
		},
		analysis: []
	};
}

//-------------------------

chrome.runtime.onInstalled.addListener(() => {
	console.debug("bg : onInstalled : page analyzer extension initiated.");

	// -----

	chrome.contextMenus.create({
		id: "openAnalyzerPanel",
		title: "Analyze this page",
		contexts: ["all"]
	});
	console.debug("bg : onInstalled : page analyzer context menu added.");
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "openAnalyzerPanel")
	{
		(async () => {
			await chrome.sidePanel
				.setOptions({
						tabId: tab.tabId,
						path: "pageAnalyzer.html",
						enabled: true
					})
				.catch((error) => console.error(error));
		})();
		console.debug("bg : openAnalyzerPanel : page analyzer side panel created.");

		chrome.sidePanel.open({ tabId: tab.tabId, windowId: tab.windowId },
			() => {
				chrome.tabs.query({currentWindow: true, active: true}, 
					function(tabs){
						let activeTab = tabs[0];
						
						chrome.runtime.sendMessage({ activity: "analyzePageStarted", data: "" },
							(function(response) {
								processMessageFetchPageDetails(activeTab.url).then(pageDetails => {
									console.debug("bg : openAnalyzerPanel : pageDetails <" + JSON.stringify(pageDetails) + ">");
									chrome.runtime.sendMessage({ activity: "analyzePageComplete", data: pageDetails },
									(function(response) {
										//doNothing
									}));
								});
							})
						);
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
		console.debug("bg : onMessage : request.activity <" + request.activity + ">");
		if (request.activity == "xyz")
		{
			//
		}
		else
		{
			console.error("bg : onMessage : invalid message <" + request.activity + ">");
			let errResp = {isError: true, message: "invalid message <" + request.activity + ">"};
			sendResponse({response : JSON.stringify(errResp)});
		}
		return true;
	}
);

//-------------------------

function getReadableTTL(input)
{
	//console.debug("ttlsec [", input, "]");
	
	//https://stackoverflow.com/questions/8211744/convert-time-interval-given-in-seconds-into-more-human-readable-form
	let levels = [
		[Math.floor(input / 31536000), "years"],
		[Math.floor((input % 31536000) / 86400), "days"],
		[Math.floor(((input % 31536000) % 86400) / 3600), "hours"],
		[Math.floor((((input % 31536000) % 86400) % 3600) / 60), "minutes"],
		[(((input % 31536000) % 86400) % 3600) % 60, "seconds"],
	];
	
	let ttl = "";
	let max = levels.length;
	for (let i = 0; i < max; i++)
	{
		if (levels[i][0] === 0)
		{
			continue;
		}
		else
		{
			ttl += " " 
					+ levels[i][0] 
					+ " " 
					+ (levels[i][0] === 1 
						? levels[i][1].substr(0, levels[i][1].length-1) 
						: levels[i][1]);
		}
	};
	
	//console.debug("ttl [", ttl, "]");
	return ttl.trim();
}

function parseResponseFetchPageDetails(reqUrl, response, pageDetails)
{
	//console.debug("bg : parseResponseFetchPageDetails : response <" + response.toString() + ">");
	//response.headers.get("x-nv-debug");
	//parseInt(hdr_age);
	//getReadableTTL(cacheTTL);

	pageDetails.responseStatus.url = reqUrl;
	pageDetails.responseStatus.httpStatus = response.status;

	if(response.status > 299)
	{
		pageDetails.isError = true;
		pageDetails.message = "Non-success response";
	}

	let analysisObject= getDefaultAnalysisObject();
	analysisObject.observation = "yet to be implemented";
	analysisObject.suggestions.push("yet to be implemented");
	pageDetails.analysis.push(analysisObject);

	return pageDetails;
}

async function processMessageFetchPageDetails(reqUrl)
{
	console.debug("bg : processMessageFetchPageDetails : reqUrl <" + reqUrl + ">");
	
	let pageDetails = {};
	
	await timeout(timeoutMsec, 
			fetch(reqUrl, {
				method: "GET",
				headers: debugHeaders,
				mode: "cors"
			}))
	.then(function(response) {
		let responseObject = getDefaultResponseObject();
		responseObject.isError = false;
		responseObject.message = "success";
		pageDetails = parseResponseFetchPageDetails(reqUrl, response, responseObject);
	})
	.catch(function (err) {
		console.error("bg : processMessageFetchPageDetails : fetch failed <" + err.message + ">");
		let responseObject = getDefaultResponseObject();
		responseObject.isError = true;
		responseObject.message = err.message;
		pageDetails = parseResponseFetchPageDetails(reqUrl, response, responseObject);
	});

	console.debug("bg : processMessageFetchPageDetails : pageDetails <" + JSON.stringify(pageDetails) + ">");
	return pageDetails;
}