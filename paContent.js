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

function getDefaultResponseObject(isErrorVal=false, messageVal="success", urlVal="")
{
	return {
		isError: isErrorVal,
		message: messageVal, 
		responseStatus : {
			url: urlVal,
			httpStatus: "",
			pageSize: -1
		},
		pageContents : {
			dnsPrefetches: [],
			preconnects: [],
			preloads: [],
			images: [],
			fonts: [],
			videos: [],
			stylesheets: [],
			scripts: [],
			scriplets: [],
			domainsReferred: []
		},
		analysis: []
	};
}

function getDefaultDnsPrefetchObject(hrefVal="", isCrossOriginVal=false)
{
	return {
		href: hrefVal,
		isCrossOrigin: isCrossOriginVal,
		domain: ""
	};
}

function getDefaultPreconnectObject(hrefVal="", isCrossOriginVal=false)
{
	return {
		href: hrefVal,
		isCrossOrigin: isCrossOriginVal,
		domain: ""
	};
}

function getDefaultPreloadObject(hrefVal="", asVal=false)
{
	return {
		href: hrefVal,
		as: asVal,
		domain: ""
	};
}

function getDefaultImageObject(srcVal="")
{
	return {
		src: srcVal,
		type: "",
		size: -1,
		domain: "",
		initiator: ""
	};
}

function getDefaultJsScriptObject(srcVal="")
{
	return {
		src: srcVal,
		size: -1,
		type: "",
		domain: "",
		initiator: ""
	};
}

function getDefaultJsScriptletObject(contentVal="")
{
	return {
		content: contentVal,
		size: -1,
		type: "",
		domain: "",
		initiator: ""
	};
}

function getDefaultCssObject(hrefVal="")
{
	return {
		href: hrefVal,
		size: -1,
		domain: "",
		initiator: ""
	};
}

function getDefaultFontObject(srcVal="")
{
	return {
		src: srcVal,
		size: -1,
		domain: "",
		initiator: ""
	};
}

function getDefaultVideoObject(srcVal="")
{
	return {
		src: srcVal,
		size: -1,
		domain: "",
		initiator: ""
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
	if(pageDetails.pageContents.dnsPrefetches.length > 0)
	{
		let analysisObject= getDefaultAnalysisObject();
		analysisObject.observation = "Page contains dns-prefetch elements [" + pageDetails.pageContents.dnsPrefetches.length + "]." ;
		analysisObject.suggestions.push("Use preconnect element instead, as it is superset of dns-prefetch.");
		pageDetails.analysis.push(analysisObject);
	}
	
	if(pageDetails.pageContents.preconnects.length > 5)
	{
		let analysisObject= getDefaultAnalysisObject();
		analysisObject.observation = "Page contains too many preconnects [" + pageDetails.pageContents.preconnects.length + "]." ;
		analysisObject.suggestions.push("Restrict the number of preconnects to no more than 5.");
		pageDetails.analysis.push(analysisObject);
	}
	
	if(pageDetails.pageContents.preloads.length > 5)
	{
		let analysisObject= getDefaultAnalysisObject();
		analysisObject.observation = "Page contains too many preloads [" + pageDetails.pageContents.preloads.length + "]." ;
		analysisObject.suggestions.push("Restrict the number of preloads to no more than 5.");
		pageDetails.analysis.push(analysisObject);
	}
	
	if(pageDetails.pageContents.stylesheets.length > 15)
	{
		let analysisObject= getDefaultAnalysisObject();
		analysisObject.observation = "Page contains too many stylesheets [" + pageDetails.pageContents.stylesheets.length + "]." ;
		analysisObject.suggestions.push("Restrict the number of stylesheets to no more than 15.");
		pageDetails.analysis.push(analysisObject);
	}
	
	if(pageDetails.pageContents.scripts.length > 15)
	{
		let analysisObject= getDefaultAnalysisObject();
		analysisObject.observation = "Page contains too many scripts [" + pageDetails.pageContents.scripts.length + "]." ;
		analysisObject.suggestions.push("Restrict the number of scripts to no more than 15.");
		pageDetails.analysis.push(analysisObject);
	}
	
	if(pageDetails.pageContents.scriplets.length > 0)
	{
		let analysisObject= getDefaultAnalysisObject();
		analysisObject.observation = "Page contains too many scriplets [" + pageDetails.pageContents.scriplets.length + "]." ;
		analysisObject.suggestions.push("Move them to the script files.");
		pageDetails.analysis.push(analysisObject);
	}

	return pageDetails;
}

function analyzePage()
{
	let pageDetails = getDefaultResponseObject(false, "success", window.location.href);

	//-----

	let pageElements = document.querySelectorAll("link[rel='dns-prefetch']");
	console.debug("pa-c : analyzePage : dns-prefetch <" + pageElements.length + ">");
	pageElements.forEach(pageElement => {
		let elementTypeObject = getDefaultDnsPrefetchObject();
		elementTypeObject.href = pageElement.getAttribute("href");
		//TODO : get other attributes
		pageDetails.pageContents.dnsPrefetches.push(elementTypeObject);
	});

	pageElements = document.querySelectorAll("link[rel='preconnect']");
	console.debug("pa-c : analyzePage : preconnect <" + pageElements.length + ">");
	pageElements.forEach(pageElement => {
		let elementTypeObject = getDefaultPreconnectObject();
		elementTypeObject.href = pageElement.getAttribute("href");
		//TODO : get other attributes
		pageDetails.pageContents.preconnects.push(elementTypeObject);
	});

	pageElements = document.querySelectorAll("link[rel='preload']");
	console.debug("pa-c : analyzePage : preload <" + pageElements.length + ">");
	pageElements.forEach(pageElement => {
		let elementTypeObject = getDefaultPreloadObject();
		elementTypeObject.href = pageElement.getAttribute("href");
		elementTypeObject.as = pageElement.getAttribute("as");
		//TODO : get other attributes
		pageDetails.pageContents.preloads.push(elementTypeObject);
	});

	pageElements = document.querySelectorAll("img");
	console.debug("pa-c : analyzePage : img <" + pageElements.length + ">");
	pageElements.forEach(pageElement => {
		let elementTypeObject = getDefaultImageObject();
		elementTypeObject.src = pageElement.getAttribute("src");
		//TODO : get other attributes
		pageDetails.pageContents.images.push(elementTypeObject);
	});

	pageElements = document.querySelectorAll("link[rel='stylesheet']");
	console.debug("pa-c : analyzePage : stylesheet <" + pageElements.length + ">");
	pageElements.forEach(pageElement => {
		let elementTypeObject = getDefaultCssObject();
		elementTypeObject.href = pageElement.getAttribute("href");
		//TODO : get other attributes
		pageDetails.pageContents.stylesheets.push(elementTypeObject);
	});

	pageElements = document.querySelectorAll("script[src]");
	console.debug("pa-c : analyzePage : script <" + pageElements.length + ">");
	pageElements.forEach(pageElement => {
		let elementTypeObject = getDefaultJsScriptObject();
		elementTypeObject.src = pageElement.getAttribute("href");
		//TODO : get other attributes
		pageDetails.pageContents.scripts.push(elementTypeObject);
	});

	pageElements = document.querySelectorAll("script:not(src)");
	console.debug("pa-c : analyzePage : scriptlet <" + pageElements.length + ">");
	pageElements.forEach(pageElement => {
		let elementTypeObject = getDefaultJsScriptletObject();
		elementTypeObject.src = pageElement.getAttribute("src");
		//TODO : get other attributes
		pageDetails.pageContents.scriplets.push(elementTypeObject);
	});

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