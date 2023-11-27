const domainNameRegex = /^https:\/\/([^\/]+)\/.*/i;

function isStringEmpty(inputVal)
{
	return (inputVal == undefined || inputVal == null || inputVal.length === 0 || inputVal.toString().replace(/\s/g,"") == "") ? true : false;
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
	if(isStringEmpty(resp))
	{
		showLog("Analysis status: Some unexpected error have occurred", true);
	}
	else
	{
		let data = JSON.parse(resp);

		showLog("Analysis status: " + data.message, data.isError);
		
		document.getElementById("analysis").value = JSON.stringify(data, null, 4);
		resizeResults();
			
		/* document.getElementById("saveResultsButton").disabled = false; */
	}
}

//-------------------------

function resetValues()
{
	showLog("-", false);
	document.getElementById("analysis").value = "-";
}

function bindHandlers()
{
	document.getElementById("portalUrl").addEventListener("click", openPortalUrl);

	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			alert("pu : bindHandlers : activity <" + request.activity + ">");
			if (request.activity === "analyzePageStarted")
			{
				showLog("Analysis status: analyzing...", false);
				sendResponse("ok");
			}
			else if (request.activity === "analyzePageComplete")
			{
				processResponseFetchPageDetails(JSON.stringify(request.data));
				sendResponse("ok");
			}
			else
			{
				showLog("pu : bindHandlers : invalid message <" + request.activity + ">", true);
				sendResponse("invalid message <" + request.activity + ">");
			}
			return true;
		}
	);
}

function initialize()
{
	resetValues();
	bindHandlers();
}

//-------------------------

window.onload = function() {
	initialize();
}