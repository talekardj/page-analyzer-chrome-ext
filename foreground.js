const extensionStorage = chrome.storage.local; //USE chrome.storage.sync INSTEAD
const domainNameRegex = /^https:\/\/([^\/]+)\/.*/i;
var currentPageURL = "";

function isStringEmpty(inputVal)
{
	return (inputVal == undefined || inputVal == null || inputVal.length === 0 || inputVal.toString().replace(/\s/g,"") == "") ? true : false;
}

function isValidUrl(inputVal)
{
	try
	{
		new URL(inputVal);
		return true;
	}
	catch (err)
	{
		return false;
	}
}

function getCurrentPageURL()
{
	chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
		currentPageURL = tabs[0].url;
	});
	return currentPageURL;
}

function getDomainNameFromUrl(inputVal)
{
	return inputVal.match(domainNameRegex)[1];
}

function showLog(logStr, isError=false)
{
	document.getElementById("reqStatus").innerText = logStr;
	document.getElementById("reqStatus").style.color = (isError ? "#FF0000" : "#FFFFFF");
}

function resizeResults()
{
	let analysis = document.getElementById("analysis");
	analysis.style.height = "auto";
	analysis.style.height = (analysis.scrollHeight) + "px";
}

//-------------------------

function openPortalUrl()
{
	chrome.tabs.create({
		url: "https://www.linkedin.com/pub/dhananjay-talekar/4a/255/918"
	});
}

//-------------------------

function processResponseFetchPageDetails(resp)
{
	document.getElementById("fetchDataButton").disabled = false;

	if(isStringEmpty(resp))
	{
		showLog("Analysis status: Some unexpected error have occurred", true);
	}
	else
	{
		let data = JSON.parse(resp.response);
		showLog("Analysis status: " + data.message, data.isError);
		if(!data.isError)
		{
			document.getElementById("analysis").value = JSON.stringify(data, null, 4);
			resizeResults();
			
			/* document.getElementById("saveResultsButton").disabled = false; */
		}
	}
}

function fetchPageDetails()
{
	resetValues();
	document.getElementById("fetchDataButton").disabled = true;
	showLog("Analysis status: analyzing...", false);

	let message = {
		activity: "analyzePage", 
		reqUrl: currentPageURL.trim()
	};

	chrome.runtime.sendMessage(message, function(resp) { processResponseFetchPageDetails(resp); });
}

//-------------------------

function resetValues()
{
	showLog("-", false);
	document.getElementById("analysis").value = "-";
}

function bindHandlers()
{
	document.getElementById("fetchDataButton").addEventListener("click", fetchPageDetails);
	document.getElementById("portalUrl").addEventListener("click", openPortalUrl);
}

function initialize()
{
	currentPageURL = getCurrentPageURL();
	resetValues();
	bindHandlers();
}

//-------------------------

window.onload = function() {
	initialize();
}