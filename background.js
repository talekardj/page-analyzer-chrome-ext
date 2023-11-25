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

function getReadableTTL(input)
{
	//console.debug("ttlsec [", input, "]");
	
	//https://stackoverflow.com/questions/8211744/convert-time-interval-given-in-seconds-into-more-human-readable-form
	let levels = [
		[Math.floor(input / 31536000), 'years'],
		[Math.floor((input % 31536000) / 86400), 'days'],
		[Math.floor(((input % 31536000) % 86400) / 3600), 'hours'],
		[Math.floor((((input % 31536000) % 86400) % 3600) / 60), 'minutes'],
		[(((input % 31536000) % 86400) % 3600) % 60, 'seconds'],
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

function parseResponseFetchPageDetails(request, response, pageDetails)
{
	//console.debug("bg : parseResponseFetchPageDetails : response <" + response.toString() + ">");
	//response.headers.get("x-nv-debug");
	//parseInt(hdr_age);
	//getReadableTTL(cacheTTL);

	pageDetails.responseStatus.url = request.reqUrl;
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

function processMessageFetchPageDetails(request, sendResponse)
{
	console.debug("bg : processMessageFetchPageDetails : request.reqUrl <" + request.reqUrl + ">");
	timeout(timeoutMsec, 
			fetch(request.reqUrl, {
				method: "GET",
				headers: debugHeaders,
				mode: "cors"
			}))
	.then(function(response) {
		let pageDetails = getDefaultResponseObject();
		pageDetails.isError = false;
		pageDetails.message = "success";
		pageDetails = parseResponseFetchPageDetails(request, response, pageDetails);

		console.debug("bg : processMessageFetchPageDetails : pageDetails <" + JSON.stringify(pageDetails) + ">");
		sendResponse({response : JSON.stringify(pageDetails)});
	})
	.catch(function (err) {
		console.error("bg : processMessageFetchPageDetails : fetch failed <" + err.message + ">");
		let pageDetails = getDefaultResponseObject();
		pageDetails.isError = true;
		pageDetails.message = err.message;
		pageDetails = parseResponseFetchPageDetails(request, response, pageDetails);
		
		console.error("bg : processMessageFetchPageDetails : pageDetails <" + JSON.stringify(pageDetails) + ">");
		sendResponse({response : JSON.stringify(pageDetails)});
	});
}

//-------------------------

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		console.debug("bg : onMessage : request.activity <" + request.activity + ">");
		if (request.activity == "analyzePage")
		{
			processMessageFetchPageDetails(request, sendResponse);
		}
		else
		{
			console.debug("bg : onMessage : invalid message <" + request.activity + ">");
			let errResp = {isError: true, message: "invalid message <" + request.activity + ">"};
			sendResponse({response : JSON.stringify(errResp)});
		}
		return true;
	}
);

chrome.runtime.onInstalled.addListener(() => {
	console.debug("bg : onInstalled : page analyzer extension initiated.");
});