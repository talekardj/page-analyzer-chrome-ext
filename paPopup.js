function isStringEmpty(inputVal)
{
	return (inputVal == undefined || inputVal == null || inputVal.length === 0 || inputVal.toString().replace(/\s/g,"") == "") ? true : false;
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

function renderResults(data)
{
	document.getElementById("analysis").innerHTML = "";
	//document.getElementById("analysis").innerHTML = JSON.stringify(data, null, 4);
	
	let observationUl = document.createElement("ul");
	data.analysis.forEach(note => {
		let observationLi = document.createElement("li");
		observationLi.innerHTML = "Observation: " + note.observation + "</br>Suggestions:";
		
		let suggestionUl = document.createElement("ul");
		note.suggestions.forEach(suggestion => {
			let suggestionLi = document.createElement("li");
			suggestionLi.innerHTML = suggestion;

			suggestionUl.appendChild(suggestionLi);
		});
		observationLi.appendChild(suggestionUl);

		observationUl.appendChild(observationLi);
	});
	
	document.getElementById("analysis").appendChild(observationUl);
}

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
		renderResults(data);
		
		/* document.getElementById("saveResultsButton").disabled = false; */
	}
}

//-------------------------

function resetValues()
{
	showLog("-", false);
	//document.getElementById("analysis").innerText = "-";
}

function bindHandlers()
{
	document.getElementById("portalUrl").addEventListener("click", openPortalUrl);

	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			//alert("pa-p : bindHandlers : activity <" + request.activity + ">");
			if (request.activity === "analyzePageStarted")
			{
				showLog("Analysis status: analyzing...", false);
			}
			else if (request.activity === "analyzePageComplete")
			{
				processResponseFetchPageDetails(JSON.stringify(request.data));
			}
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