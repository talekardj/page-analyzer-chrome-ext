console.debug("pa-c : load : contentScript got injected in <" + window.location.href + "> !");

const domainHostRegex = /^https:\/\/([^\/]+)\/.*/i;
const imageRequestRegex = /.+\.(jpg|jpeg|png|gif|svg|webp|avif|bmp|ico).*/i;
const timeoutMsec = 10000;
const debugHeaders = {
	"X-NV-Debug" : "1"
};


function isStringEmpty(inputVal)
{
	return (inputVal == undefined || inputVal == null || inputVal.length === 0 || inputVal.toString().replace(/\s/g,"") == "") ? true : false;
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
			httpStatus: "",
			pageSize: -1
		},
		pageContents : {
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

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.debug("pa-c : onMessage : activity <" + request.activity + ">");
		if (request.activity === "analyzePage")
		{
			processMessageAnalyzePage();
		}
	}
);

//-------------------------

function getAnalysis(pageDetails)
{
	let analysisObject= getDefaultAnalysisObject();
	analysisObject.observation = "yet to be implemented";
	analysisObject.suggestions.push("yet to be implemented");
	pageDetails.analysis.push(analysisObject);

	return pageDetails;
}

function analyzePage()
{
	let pageDetails = getDefaultResponseObject();

	//-----

	pageDetails.isError = false;
	pageDetails.message = "success";
	pageDetails.responseStatus.url = window.location.href;

	/* let missingImgCount = document.querySelectorAll("img[src*='/img/missing-image.svg']").length;
	console.debug("pa-c : load : missingImgCount <" + missingImgCount + ">"); */

	//-----

	pageDetails = getAnalysis(pageDetails);

	//-----

	console.debug("pa-c : analyzePage : pageDetails <" + JSON.stringify(pageDetails) + ">");
	return pageDetails;
}

function processMessageAnalyzePage()
{
	let pageDetails = analyzePage();

	chrome.runtime.sendMessage({ activity: "analyzePageComplete", data: pageDetails });
}