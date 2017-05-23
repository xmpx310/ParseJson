/**
 * Adapted the code in to order to run in a web worker. 
 * 
 * Original author: Benjamin Hollis
 */

function ontoggle(event) {
	var collapsed, target = event.target;
	if (event.target.className == 'collapser') {
		collapsed = target.parentNode.getElementsByClassName('collapsible')[0];
		if (collapsed.parentNode.classList.contains("collapsed"))
			collapsed.parentNode.classList.remove("collapsed");
		else
			collapsed.parentNode.classList.add("collapsed");
	}
}

function onexpand() {
	Array.prototype.forEach.call(collapsers, function(collapsed) {
		if (collapsed.parentNode.classList.contains("collapsed"))
			collapsed.parentNode.classList.remove("collapsed");
	});
}

function onreduce() {
	Array.prototype.forEach.call(collapsers, function(collapsed) {
		if (!collapsed.parentNode.classList.contains("collapsed"))
			collapsed.parentNode.classList.add("collapsed");
	});
}

function getParentLI(element) {
	if (element.tagName != "LI")
		while (element && element.tagName != "LI")
			element = element.parentNode;
	if (element && element.tagName == "LI")
		return element;
}

var onmouseMove = (function() {
	var hoveredLI;

	function onmouseOut() {
		var statusElement = document.querySelector(".status");
		if (hoveredLI) {
			hoveredLI.firstChild.classList.remove("hovered");
			hoveredLI = null;
			statusElement.innerText = "";
			jsonSelector = [];
		}
	}

	return function(event) {
		if (event.isTrusted === false)
			return;
		var str = "", statusElement = document.querySelector(".status");
		element = getParentLI(event.target);
		if (element) {
			jsonSelector = [];
			if (hoveredLI)
				hoveredLI.firstChild.classList.remove("hovered");
			hoveredLI = element;
			element.firstChild.classList.add("hovered");
			do {
				if (element.parentNode.classList.contains("array")) {
					var index = [].indexOf.call(element.parentNode.children, element);
					str = "[" + index + "]" + str;
					jsonSelector.unshift(index);
				}
				if (element.parentNode.classList.contains("obj")) {
					var key = element.firstChild.firstChild.innerText;
					str = "." + key + str;
					jsonSelector.unshift(key);
				}
				element = element.parentNode.parentNode.parentNode;
			} while (element.tagName == "LI");
			if (str.charAt(0) == '.')
				str = str.substring(1);
			statusElement.innerText = str;
			return;
		}
		onmouseOut();
	};
})();

var selectedLI;

function onmouseClick() {
	if (selectedLI)
		selectedLI.firstChild.classList.remove("selected");
	selectedLI = getParentLI(event.target);
	if (selectedLI) {
		selectedLI.firstChild.classList.add("selected");
	}
}

function onContextMenu(ev) {
	if (ev.isTrusted === false)
		return;
	var currentLI, statusElement, selection = "", i, value;
	currentLI = getParentLI(event.target);
	statusElement = document.querySelector(".status");
	if (currentLI) {
		var value = jsonObject;
		jsonSelector.forEach(function(idx) {
			value = value[idx];
		});
		port.postMessage({
			copyPropertyPath : true,
			path : statusElement.innerText,
			value : typeof value == "object" ? JSON.stringify(value) : value
		});
	}
}
 
function htmlEncode(t) {
	return t != null ? t.toString().replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
}

function decorateWithSpan(value, className) {
	return '<span class="' + htmlEncode(className) + '">' + htmlEncode(value) + '</span>';
}

function valueToHTML(value) {
	var valueType = typeof value, output = "";
	if (value == null)
		output += decorateWithSpan("null", "type-null");
	else if (value && value.constructor == Array)
		output += arrayToHTML(value);
	else if (valueType == "object")
		output += objectToHTML(value);
	else if (valueType == "number")
		output += decorateWithSpan(value, "type-number");
	else if (valueType == "string")
		if (/^https?:\/\/[^\s]+$/.test(value))
			output += decorateWithSpan('"', "type-string") + '<a href="' + htmlEncode(value) + '">' + htmlEncode(value) + '</a>' + decorateWithSpan('"', "type-string");
		else
			output += decorateWithSpan('"' + value + '"', "type-string");
	else if (valueType == "boolean")
		output += decorateWithSpan(value, "type-boolean");

	return output;
}

function arrayToHTML(json) {
	var i, length, output = '<div class="collapser"></div>[<span class="ellipsis"></span><ul class="array collapsible">', hasContents = false;
	for (i = 0, length = json.length; i < length; i++) {
		hasContents = true;
		output += '<li><div class="hoverable">';
		output += valueToHTML(json[i]);
		if (i < length - 1)
			output += ',';
		output += '</div></li>';
	}
	output += '</ul>]';
	if (!hasContents)
		output = "[ ]";
	return output;
}

function objectToHTML(json) {
	var i, key, length, keys = Object.keys(json), output = '<div class="collapser"></div>{<span class="ellipsis"></span><ul class="obj collapsible">', hasContents = false;
	for (i = 0, length = keys.length; i < length; i++) {
		key = keys[i];
		hasContents = true;
		output += '<li><div class="hoverable">';
		output += '<span class="property">' + htmlEncode(key) + '</span>: ';
		output += valueToHTML(json[key]);
		if (i < length - 1)
			output += ',';
		output += '</div></li>';
	}
	output += '</ul>}';
	if (!hasContents)
		output = "{ }";
	return output;
}
function jsonToHTML(json, fnName) {
	var output = '';
	if (fnName)
		output += '<div class="callback-function">' + htmlEncode(fnName) + '(</div>';
	output += '<div id="json">';
	output += valueToHTML(json);
	output += '</div>';
	if (fnName)
		output += '<div class="callback-function">)</div>';
	return output;
}


function displayUI(html,Container) {
	var statusElement, toolboxElement, expandElement, reduceElement, viewSourceElement, optionsElement, content = "";
	// content += '<link rel="stylesheet" type="text/css" href="css/jsonview-core.css">';
	//content += "<style>" + theme.replace(/<\/\s*style/g, '') + "</style>";
	content += html;
	document.getElementById(Container).innerHTML = content;
	collapsers = document.querySelectorAll("#json .collapsible .collapsible");
	statusElement = document.createElement("div");
	statusElement.className = "status";
	copyPathElement = document.createElement("div");
	copyPathElement.className = "copy-path";
	statusElement.appendChild(copyPathElement);
	document.body.appendChild(statusElement);
	// toolboxElement = document.createElement("div");
	// toolboxElement.className = "toolbox";
	expandElement = document.createElement("span");
	expandElement.title = "expand all";
	expandElement.innerText = "+";
	reduceElement = document.createElement("span");
	reduceElement.title = "reduce all";
	reduceElement.innerText = "-";
	// viewSourceElement = document.createElement("a");
	// viewSourceElement.innerText = "View source";
	// viewSourceElement.target = "_blank";
	// viewSourceElement.href = "view-source:" + location.href;
	// optionsElement = document.createElement("img");
	// optionsElement.title = "options";
	// optionsElement.src = "options.png";
	// toolboxElement.appendChild(expandElement);
	// toolboxElement.appendChild(reduceElement);
	// toolboxElement.appendChild(viewSourceElement);
	// toolboxElement.appendChild(optionsElement);
	// document.body.appendChild(toolboxElement);
	document.body.addEventListener('click', ontoggle, false);
	document.body.addEventListener('mouseover', onmouseMove, false);
	document.body.addEventListener('click', onmouseClick, false);
	// document.body.addEventListener('contextmenu', onContextMenu, false);
	expandElement.addEventListener('click', onexpand, false);
	reduceElement.addEventListener('click', onreduce, false);
	/*optionsElement.addEventListener("click", function(ev) {
		if (ev.isTrusted === false)
			return;
		window.open(chrome.runtime.getURL("options.html"));
	}, false);*/
	copyPathElement.addEventListener("click", function(ev) {
		if (ev.isTrusted === false)
			return;
		port.postMessage({
			copyPropertyPath : true,
			path : statusElement.innerText
		});
	}, false);
    $("button[name='openAll']").click(onexpand);
    $("button[name='closeAll']").click(onreduce);
    // addControlButton();
}
