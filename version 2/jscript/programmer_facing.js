
//function to send email, for save and share.
var sendEmail = function(scriptId, sname, owner){
	var ems = $("#emails").val();
	ems = ems.replace(/\s/g, '');
	//alert(ems);
	var emList = ems.split(',');
	//alert("shared with " + emList.length);
	console.log("clicked share");
	
	for(var i=0;i<emList.length;i++){
		var dataString = "\'{\"scriptId\":\""+scriptId+"\",\"sName\":\""+sname+"\",\"owner\":\""+owner+"\",\"toAddress\":\""+emList[i]+"\"}'";
		var jsonObj = eval(dataString);
		//alert(dataString);
		$.ajax({
			type: "POST",
			url: "https://api.parse.com/1/functions/sendMail",
			data: jsonObj,
			dataType: "json",
			headers: {"X-Parse-Application-Id": "C9TPknemAEmJzz1xcKFbBC855l64A4T4R2EFjxBH", "X-Parse-REST-API-Key": "PyzUr85ywV4vISJ5M74qUy2f9Dv4heBsaOZTgflo","Content-Type": "application/json"}
		}).done(function() {
			console.log("Email Sent!");
		});
	}
}

var currentUser = Parse.User.current();
if (!currentUser) {
	window.location = "biomate_login.html";
}

var dragsort = ToolMan.dragsort()
var junkdrawer = ToolMan.junkdrawer()

$(function() {
	
	//***************
	//Sumaiya's code.
	//***************
	var userSpan = document.getElementById("userName");
	userSpan.innerHTML = currentUser.get("name");
	$("#btnSignOut").click(function(e){
		Parse.User.logOut();
		window.location = "biomate_login.html";
	});
	
	//**************************************************
	//General utility functions and variable declaration
	//**************************************************
	var scriptName = "";
	var tooltipShow = 0; //a hack to handle unwanted upwards event propagation.
	var currentOpenWarningTooltipObject = undefined; //keeps track of the warning tooltip that is open.
	var staticTextInstanceLookup = {}; //dictionary for looking up the static text parse objects using the object id.
	var parametersInstanceLookup = {};
	var numCommandChunkObjects = 0; //is needed so that createScriptData is only called after all the commandChunk objects are created.
	var finalCommandChunkObjects = []; //array which objects of type command chunk
	var scriptObjectId = undefined;
	var scriptParseObject = undefined;
	var shareAfterSaving = false; //used to implement save and share, without problems of interleaving.
	var exitAfterSaving = false; //used to implement save before exit.
	
	var availableScripts = []; //will store the list of scripts that this user can edit.
	var availableScriptsLookup = {};
	
	
	var loadScript = function(script) {
		$("#scriptSelection").remove();
		$("#programmer-layout").show();
		//iterate over the command chunks and add them in.
		scriptParseObject = script;
		scriptName = script.get("name");
		$("#pageHeaderContents").html("<input id='theScriptName' class='input-block-level' type='text' value='"+scriptName+"'></input>");
		$("#theScriptName").keypress(function (e) {
			console.log("keypress");
			if (e.which == 13) {
				console.log("script name change");
				$("#theScriptName").blur();
			}
		});
		console.log(scriptName+" loaded");
		var scriptData = script.get("privateScriptData");
		chunks = scriptData.get("chunks");
		var len = chunks.length;
		console.log("num chunks: "+len);
		for(var i = 0; i < len; ++i) {
			var chunk = chunks[i];
			if(chunk.get("commandChunkType") === CommandChunkType.PARAMETER) {
				var chunkData = chunk.get("parameter");
				addParameterToTable(chunkData);
			} else {
				var chunkData = chunk.get("staticText");
				addStaticText(chunkData);
			}
		}
		console.log(scriptData.get("caveats"));
		console.log(scriptData.get("instructions"));
		$("#caveatsInput").val(scriptData.get("caveats"));
		$("#generalInstructionsInput").val(scriptData.get("instructions"));
        var lastSavedAt = scriptData.updatedAt;
		$("#lastSavedAt").html(timeToString(lastSavedAt) +" on "+ dateToString(lastSavedAt));
        console.log($("#lastSavedAt").html());
	}
	
	
	//check if script id passed in...
	if ($.getUrlVar('scriptId')) {
		var scriptId = $.getUrlVar('scriptId');
		Script.getScriptById(scriptId, loadScript);
	}
	
	//argument passed in is a list of all the scripts associated with the user.
	var loadOwnedScripts = function(ownedScripts) {
		for (var i = 0; i < ownedScripts.length; i++) {
			var name = ownedScripts[i].get("name");
			console.log(name);
			if (name != undefined) {
				availableScripts.push(name);
				availableScriptsLookup[name] = ownedScripts[i].id;
			}
		}
	}
	Script.getOwnerScripts(currentUser, loadOwnedScripts); //load the available scripts.
	
	var updateParameter = function (parameter) { //not sure if this is necessary
		console.log("update called");
		parametersInstanceLookup[parameter.id] = parameter;
	}
	
	var openWarningTooltip = function(objectToOpenTooltipFor) {
		tooltipShow = 1;
		console.log("opening tooltip for "+objectToOpenTooltipFor.attr("id"));
		objectToOpenTooltipFor.tooltip("show");
		if (currentOpenWarningTooltipObject != undefined) {
			if (currentOpenWarningTooltipObject.attr("id") !=  objectToOpenTooltipFor.attr("id")) {
				console.log("hiding tooltip for "+currentOpenWarningTooltipObject.attr("id"));
				currentOpenWarningTooltipObject.tooltip("hide");
			}
		}
		currentOpenWarningTooltipObject = objectToOpenTooltipFor;
	}
	
	var getTheDate = function() {
		var today = new Date();
		var theDate = timeToString(today) +" on "+ dateToString(today);
        return theDate;
	}
	
	//****************
	//Script saving...
	//****************
	
	var addNextCommandChunk = function(indexToAdd) {
		if (indexToAdd == numCommandChunkObjects) { //if you are done adding all the chunks...
			ScriptData.createScriptData(finalCommandChunkObjects, $("#caveatsInput").val(), $("#generalInstructionsInput").val(), createOrEditScriptFromScriptData);
		} else {
			CommandChunk.createCommandChunk(chunks[indexToAdd].type, chunks[indexToAdd].chunk, addToFinalCommandChunkObjects);
		}

	}
	
	var addToFinalCommandChunkObjects = function(commandChunkObject) {
		finalCommandChunkObjects.push(commandChunkObject);
		console.log(numCommandChunkObjects+" "+finalCommandChunkObjects.length);
		//force some sequential adding.
		addNextCommandChunk(finalCommandChunkObjects.length);
	}
	
	var getListOfChunkObjects = function() { //iterates over the chunks container.
		chunks = document.getElementById("chunksContainer").childNodes;
		chunkObjectsArray = [];
		numCommandChunkObjects = 0;
		for (i = 0; i < chunks.length; i++) {
			var elem = $("#"+chunks[i].id);
			if (elem.hasClass("staticTextChunk")) {
				chunkObjectsArray.push({chunk: staticTextInstanceLookup[elem.attr("id")], type: CommandChunkType.STATIC_TEXT});
				numCommandChunkObjects += 1;
			} else if (elem.hasClass("parameterChunk")) {
				chunkObjectsArray.push({chunk: parametersInstanceLookup[elem.attr("id")], type: CommandChunkType.PARAMETER});
				numCommandChunkObjects += 1;
			}
		}
		return chunkObjectsArray;
	}
	
	var saveTheScript = function() {
		chunks = getListOfChunkObjects();
		CommandChunk.createCommandChunk(chunks[0].type, chunks[0].chunk, addToFinalCommandChunkObjects); //the rest will be called iteratively.
	}
	
	
	//**********************************************************************************
	//functions pertaining to the selection and loading of a script (the landing screen)
	//**********************************************************************************
	var enableOrDisableCreateScript = function() {
		console.log("script name is: "+scriptName);
		if (scriptName.length == 0) {
			$("#createLoadScriptBtn").html("Create/Edit Script");
			if ($("#createLoadScriptBtn").attr("disabled") == undefined) {
				$("#createLoadScriptBtn").attr("disabled", "disabled");
			}
		} else {
			$("#createLoadScriptBtn").removeAttr("disabled");
			if ($.inArray(scriptName, availableScripts) == -1) {
				$("#createLoadScriptBtn").html("Create New Script");
				$("#createLoadScriptBtn").attr("action", "createNew");
			} else {
				$("#createLoadScriptBtn").html("Edit Script");
				console.log("setting attribute");
				$("#createLoadScriptBtn").attr("action", "loadScript");
				console.log("set "+$("#createLoadScriptBtn").attr("action"));
			}
		}
	}
	
	var autocompleteSelect = function(sn)  {
		console.log("blah: "+sn);
		scriptName = sn;
		enableOrDisableCreateScript()
	}
	
	
	var createOrLoadScript = function(e) {
		console.log($("#createLoadScriptBtn").attr("action"));
		if ($("#createLoadScriptBtn").attr("action") == "loadScript") {
			console.log("will load script "+scriptName);
			Script.getScriptById(availableScriptsLookup[scriptName], loadScript);
		} else {
			$("#scriptSelection").remove();
			$("#programmer-layout").show();
			$("#pageHeaderContents").html("<input id='theScriptName' class='input-block-level' type='text' value='"+scriptName+"'></input>");
			$("#theScriptName").keypress(function (e) {
				console.log("keypress");
				if (e.which == 13) {
					console.log("script name change");
					$("#theScriptName").blur();
				}
			});
		}
	}
	
	$("#enterTitle").keyup(function (e) {
		scriptName = $("#enterTitle").val();
		enableOrDisableCreateScript();
	});
	
	$("#enterTitle").autocomplete({minLength: 0,
		source: availableScripts,
		select: function(a,b) {
			autocompleteSelect(b.item.value);
		}
		
	});
	
	$("#enterTitle").keypress(function (e) {
		if (e.which == 13) {
			if (scriptName.length > 0) {
				createOrLoadScript();
			}
		}
	});
	

	$('#enterTitle').click(function(e){ $('#enterTitle').autocomplete("search","") });

	//the create script button is initially inactive
	$("#createLoadScriptBtn").attr("disabled", "disabled");
	console.log("hello");
	$("#createLoadScriptBtn").click( function(e) {
		createOrLoadScript();
	})
	
	//*********************************************************************************
	//Functions pertaining to changing the script name using the entry field at the top
	//*********************************************************************************
	
	
	//********************
	//Add/Edit static text
	//********************
	
	var addStaticText = function(staticTextInstance) {
		$("#infoMessage").hide();
		var text = staticTextInstance.get("text");
		var theId = staticTextInstance.id;
		staticTextInstanceLookup[theId] = staticTextInstance;
		$("#chunksContainer").append(
		"<li href='#' class='chunk btn staticTextChunk' id='"+theId+"' rel='popover' data-content=\"<a class='btn popoverButton popoverEditButton staticTextChunkPopover' targetid='"+theId+"'>Edit</a> <div class='btn popoverButton popoverDeleteButton staticTextChunkPopover' targetid='"+theId+"'>Delete</div>\">"+text+"</li>");
		$( ".chunk" ).disableSelection();
		$(".chunk").popover({html: true, trigger: 'none'});
		$(".chunk").mousedown(function(e) {$(this).attr('showpopover','yes')});
		$(".chunk").mousemove(function(e) {$(this).attr('showpopover','no')});
		$(".chunk").mouseup(function(e) {if($(this).attr('showpopover')=='yes') {$(this).popover('show')}});
		$("#staticTextInput").val("");
		dragsort.makeListSortable(document.getElementById("chunksContainer"), saveOrder)
	}
	
	var checkAddOrEditStaticText = function() {
		if ($("#staticTextInput").val() == "") {
			openWarningTooltip($("#staticTextInput"));
		} else {
			if ($("#staticTextWindow").attr("addOrEdit") == "add") {
				$("#staticTextWindow").modal("hide");
				StaticText.createStaticText($("#staticTextInput").val(), addStaticText);
			} else if ($("#staticTextWindow").attr("addOrEdit") == "edit") {
				var targetid = $("#popupAddStaticTextBtn").attr("targetid");
				var parseInstance = staticTextInstanceLookup[targetid];
				console.log(targetid);
				var chunk = $("#"+targetid);
				parseInstance.editStaticText({text: $("#staticTextInput").val()});
				chunk.html($("#staticTextInput").val());
				$("#staticTextWindow").modal("hide");
				$(".chunk").popover("hide");
			}
		}
	}
	
	//tooltips pertaining to add static text...
	$("#staticTextInput").tooltip({trigger: 'manual'});
	$("#addStaticText").tooltip();
	$("#addStaticText").hover(function(e) {$("#addStaticText").tooltip();});
	
	//event listeners pertaining adding static text...
	
	//the button on the main screen (not a popup)
	$("#addStaticText").click(function(e) {
		$("#addStaticText").tooltip("hide");
		$("#staticTextWindowHeader").html("Enter segment of static text");
		$("#popupAddStaticTextBtn").html("Add Static Text");
		$("#staticTextWindow").attr("addOrEdit","add");
		$("#staticTextWindow").modal("show");
	});
	
	//focus on the input when staticTextWindow is shown.
	$("#staticTextWindow").on('shown', function() {
		if (tooltipShow == 0) { //the manual showing of a tooltip propagates  show event upwards. This is so that the show resulting from displaying a tooltip is not interpeted as a show of the modal window itself.
			$("#staticTextInput").focus();
		}
		tooltipShow = 0;
	});
	
	//in the add static text popup...
	$("#popupAddStaticTextBtn").click(function (e) {
		checkAddOrEditStaticText();
	});
	
	$("#staticTextInput").keypress(function(e) {
		if (e.which == 13) {
			checkAddOrEditStaticText();
		}
	});
	
	
	//*****************************
	//Add/Edit Parameters and Flags
	//*****************************
	
	//clears all fields except type and required, to facilitated fast entry of similar parameters.
	var clearAddParamFields = function() {
		$("#aliasInput").val("");
		$("#prefixFlagInput").val("");
		$("#ufNameInput").val("");
		$("#defaultValInput").val("");
		$("#warningsInput").val("");
		$("#tooltipInput").val("");
	}
	
	var setParamChunkHtml = function(theId, prefix, alias, type) {
		var htmlContents = prefix+((prefix == "")?"":" ")+(type!=InputType.BOOLEAN? alias : "");
		$("#"+theId).html(htmlContents);
	}
	//adds a parameter chunk to the chunksContainer
	var addParameterChunk = function(theId,prefix,alias,type) {
		$("#infoMessage").hide();
		$("#chunksContainer").append(
		"<li href='#' class='chunk btn btn-primary parameterChunk' id='"+theId+"' rel='popover' data-content=\""+
		"<div class='btn popoverButton popoverEditButton parameterChunkPopover' targetid='"+theId+"'>Edit</div>"+
		"<div class='btn popoverButton popoverDeleteButton parameterChunkPopover' targetid='"+theId+"'>Delete</div>"+
		"\">"+
		"</li>");
		setParamChunkHtml(theId,prefix,alias, type);
		
		$( ".chunk" ).disableSelection();
		$(".chunk").popover({delay: { show: 500, hide: 0}, html: true});
		dragsort.makeListSortable(document.getElementById("chunksContainer"), saveOrder)
	}
	
	var editTableEntries = function (theId, alias, prefixFlag, userFriendlyName, selectedTyp, required, defaultVal) {
		
		var aliasId = theId+"_alias";
		var prefixFlagId = theId+"_prefixFlag";
		var ufNameId = theId+"_ufName";
		var requiredCheckboxId = theId+"_checkbox";
		var inputTypeId = theId+"_inputType";
		var defaultValId = theId+"_defaultVal";
		
		$("#"+aliasId).val(alias);
		$("#"+prefixFlagId).val(prefixFlag);
		$("#"+ufNameId).val(userFriendlyName);
		$("#"+inputTypeId+" option[value='"+selectedTyp+"']")[0].selected=true; //select in dropdown option
		$("#"+inputTypeId).trigger("change");
		if (required == true) {
			$("#"+requiredCheckboxId).prop("checked", 1);
		} else {
			$("#"+requiredCheckboxId).prop("checked", 0);
		}
		if (selectedTyp == InputType.BOOLEAN) {
			$("#"+requiredCheckboxId).attr("disabled","disabled");
			console.log(defaultVal);
			if (defaultVal == "on") {
				$("#"+defaultValId).prop("checked", 1);
			} else {
				$("#"+defaultValId).prop("checked", 0);
			}
		} else {
			$("#"+defaultValId).val(defaultVal);
		}
	};
	
	var addParameterToTable = function (parameterInstance) {
		
		var theId = parameterInstance.id;
		parametersInstanceLookup[theId] = parameterInstance;
		var alias = parameterInstance.get("alias");
		var prefixFlag = parameterInstance.get("prefixFlag");
		var selectedTyp = parameterInstance.get("inputType");
		var required = parameterInstance.get("required");
		
		addParameterChunk(theId, prefixFlag, alias, selectedTyp);
		
		$("#paramsTable").show();
	
		var aliasId = theId+"_alias";
		var prefixFlagId = theId+"_prefixFlag";
		var ufNameId = theId+"_ufName";
		var requiredCheckboxId = theId+"_checkbox";
		var inputTypeId = theId+"_inputType";
		var defaultValId = theId+"_defaultVal";
		var warningsId = theId+"_warnings";
		var tooltipId = theId+"_tooltip";
		
		var aliasTd = "<td> <input id='"+aliasId+"' targetid='"+theId+"' class='tableDataInput warningTooltipTable' type='text'></input></td>";
		var inputTypeTd = "<td>"+
					"<select id='"+inputTypeId+"' targetid='"+theId+"' class='input-block-level tableDataSelect'>"+
						"<option value='"+InputType.BOOLEAN+"'>Flag</option>"+
						"<option value='"+InputType.STRING+"'>String</option>"+
						"<option value='"+InputType.INT+"'>Integer</option>"+
						"<option value='"+InputType.FLOAT+"'>Float</option>"+
					"</select>"+
				"</td>";
		
		var prefixFlagTd = "<td> <input id='"+prefixFlagId+"' targetid='"+theId+"' class='tableDataInput' type='text'></input></td>";
		var ufNameTd = "<td> <input id='"+ufNameId+"' targetid='"+theId+"' type='text' class='tableDataInput warningTooltipTable'></input></td>";
		var requiredCheckboxTd = "<td> <input id='"+requiredCheckboxId+"' targetid='"+theId+"' type='checkbox'> </input></td>";
		
		var defaultValTd;
		if (selectedTyp != InputType.BOOLEAN) {
			defaultValTd = "<td> <input id='"+defaultValId+"' targetid='"+theId+"' type='text' class='tableDataInput'></input></td>";
		} else {
			defaultValTd = "<td> <input id='"+defaultValId+"' targetid='"+theId+"' type='checkbox'></input></td>";
		}
		
		var warningsTd = "<td> <button id='"+warningsId+"' targetid='"+theId+"' class='btn tdBtn'>View/Edit</button></td>";
		var tooltipTd = "<td> <button id='"+tooltipId+"' targetid='"+theId+"' class='btn tdBtn'>View/Edit</button></td>";
		
		var rowId = theId+"_row";
		//adding a row to the table.
		$("#paramsTableBody").append("<tr id='"+rowId+"'>"+
						aliasTd+
						inputTypeTd+
						prefixFlagTd+
						ufNameTd+
						requiredCheckboxTd+
						defaultValTd+
						warningsTd+
						tooltipTd+
					"</tr>");
		
		//formatting
		$("#"+aliasId).css("max-width","160px");
		$("#"+prefixFlagId).css("max-width","160px");
		$("#"+ufNameId).css("max-width","160px");
		$("#"+defaultValId).css("max-width", "160px");
		
		//modify the data in the row as necessary
		editTableEntries(theId, alias, prefixFlag, parameterInstance.get("userFriendlyName"), selectedTyp, required, parameterInstance.get("defaultVal"));
		
		
		//add listeners to the fields in the table, such that when they are edited, the value is stored.
		
		//alias
		$("#"+aliasId).blur( function(e) {
			console.log("blur event detected for alias");
			var theId = $("#"+aliasId).attr("targetid");
			var parameterInstance = parametersInstanceLookup[theId];
			var theAlias = $("#"+aliasId).val();
			if (theAlias == "") {//invalid, go back to the old one.
				$("#"+aliasId).val(parameterInstance.get("alias"));
			} else {
				console.log(parameterInstance);
				var thePrefixFlag = parameterInstance.get("prefixFlag");
				var selectedTyp = parameterInstance.get("inputType");
				parameterInstance.editParameter({alias: theAlias});
				setParamChunkHtml(theId, thePrefixFlag, theAlias, selectedTyp);
			}
		});
		
		//prefixFlag
		$("#"+prefixFlagId).blur( function(e) {
			console.log("blur event detected for prefixFlag");
			var theId = $("#"+aliasId).attr("targetid");
			var parameterInstance = parametersInstanceLookup[theId];
			var theAlias = parameterInstance.get("alias");
			var thePrefixFlag = $("#"+prefixFlagId).val();
			var selectedTyp = parameterInstance.get("inputType");
			if (selectedTyp == InputType.BOOLEAN && thePrefixFlag == "") {
				console.log("this code executed");
				$("#"+prefixFlagId).val(parameterInstance.get("prefixFlag"));
			} else {
				console.log("edit code executed "+thePrefixFlag);
				parameterInstance.editParameter({prefixFlag: thePrefixFlag, callback: updateParameter});
				setParamChunkHtml(theId, thePrefixFlag, theAlias,  selectedTyp);
			}
		});
		
		//userFriendlyName
		$("#"+ufNameId).blur( function(e) {
			console.log("blur event detected for ufName");
			var theId = $("#"+ufNameId).attr("targetid");
			var parameterInstance = parametersInstanceLookup[theId];
			var ufName = $("#"+ufNameId).val()
			if (ufName == "") {
				$("#"+ufNameId).val(parameterInstance.get("userFriendlyName"));
			} else {
				parameterInstance.editParameter({userFriendlyName: ufName});
			}
		});
		
		//input type field..
		$("#"+inputTypeId).change( function(e) {
			$("#"+defaultValId).val("");
			
			var theId = $("#"+inputTypeId).attr("targetid");
			var parameterInstance = parametersInstanceLookup[theId];
			var theAlias = parameterInstance.get("alias");
			var thePrefixFlag = parameterInstance.get("prefixFlag");
			var selectedTyp = $("#"+inputTypeId+" :selected").val();
			parameterInstance.editParameter({inputType: selectedTyp});
			
			//modify the required/default checkboxes as appropriate
			if (selectedTyp == InputType.BOOLEAN) {
				if (thePrefixFlag == "") {
					thePrefixFlag = "--defaultFlag";
					$("#"+prefixFlagId).val(thePrefixFlag);
					parameterInstance.editParameter({prefixFlag: thePrefixFlag});
					openWarningTooltip($("#"+prefixFlagId));
					$("#"+prefixFlagId).focus();
				}
				$("#"+requiredCheckboxId).prop("checked", 0);
				parameterInstance.editParameter({required: false});
				$("#"+requiredCheckboxId).attr("disabled", "disabled");
				
				$("#"+defaultValId).attr("type", "checkbox");
				$("#"+defaultValId).attr("class", "");
				if ( $("#"+defaultValId).prop("checked", 1) ) {
					parameterInstance.editParameter({defaultVal: "on"});
				} else {
					parameterInstance.editParameter({defaultVal: "off"});
				}
			} else {
				if ($("#"+requiredCheckboxId).attr("disabled") != undefined) {
					$("#"+requiredCheckboxId).removeAttr("disabled");
				}
				$("#"+defaultValId).attr("type", "text");
				$("#"+defaultValId).attr("class", "input-block-level aFormInput exitAddParamOnEnter");
			}
			
			setParamChunkHtml(theId, thePrefixFlag, theAlias, selectedTyp);
		});
		
		//required checkbox
		$("#"+requiredCheckboxId).change( function(e) {
			console.log("change event detected for requiredCheckbox");
			var theId = $("#"+requiredCheckboxId).attr("targetid");
			var parameterInstance = parametersInstanceLookup[theId];
			var isRequired = ($("#"+requiredCheckboxId).prop("checked") == 1) ? true : false;
			parameterInstance.editParameter({required: isRequired});
		});
		
		
		//default value
		$("#"+defaultValId).change( function(e) {
			console.log("change event detected for default val");
			var theId = $("#"+requiredCheckboxId).attr("targetid");
			var parameterInstance = parametersInstanceLookup[theId];
			
			var theDefaultVal;
			if (parameterInstance.get("inputType") == InputType.BOOLEAN) {
				theDefaultVal = ($("#"+defaultValId).prop("checked") == 1) ? "on" : "off";
			} else {
				theDefaultVal = $("#"+defaultValId).val();
			}
			parameterInstance.editParameter({defaultVal: theDefaultVal});
		});
		
		$("#"+warningsId).click( function(e) {
			var theId = $("#"+requiredCheckboxId).attr("targetid");
			var parameterInstance = parametersInstanceLookup[theId];
			
			$("#warningsSaveEditsBtn").attr("targetid", theId);
			$("#editWarningsInput").val(parameterInstance.get("warnings"));
			$("#editWarningsWindow").modal("show");
			
		});
		
		$("#"+tooltipId).click( function(e) {
			var theId = $("#"+requiredCheckboxId).attr("targetid");
			var parameterInstance = parametersInstanceLookup[theId];
			
			$("#tooltipSaveEditsBtn").attr("targetid", theId);
			$("#editTooltipInput").val(parameterInstance.get("tooltip"));
			$("#editTooltipWindow").modal("show");
			
		});
		
		//listeners to blur on pressing enter
		
		//alias
		$("#"+aliasId).keypress( function(e) {
			if (e.which == 13) {
				$("#"+aliasId).blur();
			}
		});
		
		//prefixFlag
		$("#"+prefixFlagId).keypress( function (e) {
			if (e.which == 13) {
				$("#"+prefixFlagId).blur();
			}
		});
		
		//ufName
		$("#"+ufNameId).keypress( function (e) {
			if (e.which == 13) {
				$("#"+ufNameId).blur();
			}
		});
		
		//defaultVal
		$("#"+defaultValId).keypress( function (e) {
			if (e.which == 13) {
				$("#"+defaultValId).blur();
			}
		});
		
	}
	
	//extracts the data in the popup, calls function to create the new chunk, adds a row to the table.
	var addParameterFromPopup = function() {
		var alias = $("#aliasInput").val()
		var prefixFlag = $("#prefixFlagInput").val();
		var ufName = $("#ufNameInput").val();
		var inputType = $("#typeInput :selected").val();
		var isRequired = ($("#requiredInput").prop("checked") == 1)? true : false;
		var defaultVal;
		if (inputType == InputType.BOOLEAN) {
			defaultVal = ($("#defaultValInput").prop("checked") == 1)? "on" : "off";
		} else {
			defaultVal = $("#defaultValInput").val();
		}
		var warnings = $("#warningsInput").val();
		var tooltip = $("#tooltipInput").val();
		Parameter.createParameter(alias, prefixFlag, ufName, defaultVal, inputType, isRequired, warnings, tooltip, addParameterToTable);
		//clear the fields. Remember the input type to facilitate streamlined entry of parameters of the same type.
	}
	
	var editParameterFromPopup = function(theId) {
		console.log("function called..."); 
		var parameterInstance = parametersInstanceLookup[theId];
		
		var theAlias = $("#aliasInput").val()
		var thePrefixFlag = $("#prefixFlagInput").val();
		var ufName = $("#ufNameInput").val();
		var theInputType = $("#typeInput :selected").val();
		var isRequired = ($("#requiredInput").prop("checked") == 1)? true : false;
		var theDefaultVal;
		if (theInputType == InputType.BOOLEAN) {
			theDefaultVal = ($("#defaultValInput").prop("checked") == 1)? "on" : "off";
		} else {
			theDefaultVal = $("#defaultValInput").val();
		}
		var theWarnings = $("#warningsInput").val();
		var theTooltip = $("#tooltipInput").val();
		
		parameterInstance.editParameter({alias: theAlias, prefixFlag: thePrefixFlag, userFriendlyName: ufName, inputType: theInputType, required: isRequired, defaultVal: theDefaultVal, warnings: theWarnings, tooltip: theTooltip});
		
		editTableEntries(theId, theAlias, thePrefixFlag, ufName, theInputType, isRequired, theDefaultVal);
		setParamChunkHtml(theId,thePrefixFlag, theAlias, theInputType);
	}
	
	//does error checking to make sure the values input into the popup are acceptable.
	var checkAddParameter = function() {
		if ($("#aliasInput").val() == "") {
			openWarningTooltip($("#aliasInput"));
			$("#aliasInput").focus();
		} else if ($("#typeInput :selected").val()=="Select...") {
			openWarningTooltip($("#typeInput"));
			$("#typeInput").focus();
		} else if ($("#typeInput :selected").val()==InputType.BOOLEAN && $("#prefixFlagInput").val() == "") {
			openWarningTooltip($("#prefixFlagInput"));
			$("#prefixFlagInput").focus();
		} else if ($("#ufNameInput").val() == "") {
			openWarningTooltip($("#ufNameInput"));
			$("#ufNameInput").focus();
		} else {
			$("#addParamWindow").modal("hide");
			if (currentOpenWarningTooltipObject != undefined) {
				currentOpenWarningTooltipObject.tooltip("hide");
			}
			currentOpenWarningTooltipObject = undefined;
			
			if ($("#addParamWindow").attr("addOrEdit") == "add") {
				addParameterFromPopup();
				console.log("adding");
			}
			if ($("#addParamWindow").attr("addOrEdit") == "edit") {
				theId = $("#popupAddParameterBtn").attr("targetid");
				editParameterFromPopup(theId);
				console.log("editing");
			}
		}
	}
	
	//tooltips for add/edit parameter
	$("#aliasInput").tooltip({trigger: 'manual', placement: 'bottom'});
	$(".warningTooltip").tooltip({trigger: 'manual'});
	$(".info").tooltip();
	$("#addParamMainBtn").tooltip();
	$("#caveatsLabel").tooltip();
	$("#generalInstructionsLabel").tooltip();
	
	//event listeners
	
	//on the main screen, the button that brings up the add paramaters modal.
	$("#addParamMainBtn").click(function(e) {
		$("#addParamMainBtn").tooltip("hide");
		clearAddParamFields();
		$("#addParamWindow").attr("addOrEdit", "add");
		$("#addParamWindowHeader").html("Add Parameter/Flag");
		$("#popupAddParameterBtn").html("Add Parameter/Flag");
		$("#addParamWindow").modal("show");
	});
	
	//focus on the aliasInput field when the modal is first shown.
	$("#addParamWindow").on('shown', function() {
		if (tooltipShow == 0) { //the manual showing of a tooltip propagates  show event upwards. This is so that the show resulting from displaying a tooltip is not interpeted as a show of the modal window itself.
			$("#aliasInput").focus();
		}
		tooltipShow = 0;
	});
	
	//deactivate the 'required' box if the type is set to flag, turn default val into a checkbox if Flag.
	$("#typeInput").change( function(e) {
		if ($("#typeInput :selected").val() == InputType.BOOLEAN) {
			//$("#requiredLabel").css("color","black");
			$("#requiredInputRow").hide();
			$("#requiredInput").prop("checked", 0);
			$("#requiredInput").attr("disabled", true);
			$("#defaultValLabelSpan").html("On by default?");
			$("#defaultValInput").attr("type", "checkbox");
			$("#defaultValInput").attr("class", "");
		} else {
			$("#requiredInputRow").show();
			$("#requiredLabel").css("color","");
			if ($("#requiredInput").attr("disabled") != undefined) {
				$("#requiredInput").removeAttr("disabled");
			}
			$("#defaultValInput").attr("type", "text");
			$("#defaultValInput").attr("class", "input-block-level aFormInput exitAddParamOnEnter");
			if ($("#requiredInput").prop("checked") == 1) {
				$("#defaultValLabelSpan").html("Suggested Value");
				$("#defaultValInput").attr("placeholder", "Eg: '/put/path/to/input/here'");
			} else {
				$("#defaultValLabelSpan").html("Default Value");
				$("#defaultValInput").attr("placeholder", "Eg: '100'");
			}
		}
	});
	
	$("#requiredInput").change( function (e) {
		if ($("#typeInput :selected").val() != InputType.BOOLEAN) { //this change event may have been fired as a result of changing the parameter type to flag, so don't respond to that...
			if ($("#requiredInput").prop("checked") == 1) {
				$("#defaultValLabelSpan").html("Suggested Value");
				$("#defaultValInput").attr("placeholder", "Eg: '/put/path/to/input/here'");
			} else {
				$("#defaultValLabelSpan").html("Default Value");
				$("#defaultValInput").attr("placeholder", "Eg: '100'");
			}
		}
	});
	
	//functions to make pressing enter move to the next input field, as necessary.
	$("#aliasInput").keypress(function(e) {
		if (e.which == 13) {
			$("#popupAddParameterBtn").click();
		}
	});
	
	$("#prefixFlagInput").keypress(function(e) {
		if (e.which == 13) {
			$("#popupAddParameterBtn").click();
		}
	});
	
	$("#ufNameInput").keypress(function(e) {
		if (e.which == 13) {
			$("#popupAddParameterBtn").click();
		}
	});
	
	$(".exitAddParamOnEnter").keypress(function (e) {
		if (e.which == 13) {
			console.log("enter as a click...");
			$("#popupAddParameterBtn").click();
		}
	});
	
	//clicking add parameter on the modal popup
	$("#popupAddParameterBtn").click(function (e) {
		console.log(e.target.id);
		checkAddParameter();
	});
	
	//focus on the text area in the edit warnings/tooltip panels
	$("#editWarningsWindow").on('shown', function (e) {
		$("#editWarningsInput").focus();
	});
	$("#editTooltipWindow").on('shown', function (e) {
		$("#editTooltipInput").focus();
	});
	
	//clicking save edits on the warnings/tooltip panel
	$("#warningsSaveEditsBtn").click(function (e) {
		console.log("saving warnings");
		var theId = $("#warningsSaveEditsBtn").attr("targetid");
		var parametersInstance = parametersInstanceLookup[theId];
		parametersInstance.editParameter({warnings: $("#editWarningsInput").val()});
	});
	$("#tooltipSaveEditsBtn").click(function (e) {
		console.log("saving tooltip");
		var theId = $("#tooltipSaveEditsBtn").attr("targetid");
		var parametersInstance = parametersInstanceLookup[theId];
		parametersInstance.editParameter({tooltip: $("#editTooltipInput").val()});
	});
	
	//*************************************
	//Pertaining to the chunks container...
	//*************************************
	
	$("#paramsTableBody").sortable();
	//$( "#chunksContainer" ).sortable({
	//	start: function(event, ui) {
	//	ui.item.bind("click.prevent",
	//		function(event) { event.preventDefault(); }); //prevents the popup from appearing on a drag...?
	//	},
	//	stop: function(event, ui) {
	//		setTimeout(function(){ui.item.unbind("click.prevent");}, 300);
	//	}
	//});
	
	function saveOrder(item) {
		var group = item.toolManDragGroup
		var list = group.element.parentNode
		var id = list.getAttribute("id")
		if (id == null) return
		group.register('dragend', function() {
			ToolMan.cookies().set("list-" + id, 
					junkdrawer.serializeList(list), 365)
		})
	}
	
	dragsort.makeListSortable(document.getElementById("chunksContainer"), saveOrder)
	$( ".chunk" ).disableSelection();
	$(".chunk").popover({delay: { show: 500, hide: 0}, html: true});

	
	//**************************************************
	//Listeners for buttons and the bottom of the screen
	//**************************************************
	
	var finishSave = function() {
		numCommandChunkObjects = 0; //reset
		finalCommandChunkObjects = [];
		$("#lastSavedAt").html(getTheDate());
		if (shareAfterSaving == true) {
			curScName = scriptParseObject.get("name");
			collName = scriptParseObject.get("owner").get("name");
			console.log(curScName,collName);
			scriptParseObject.shareScript({callback: function() {sendEmail(scriptParseObject.id, curScName,collName)}});
			shareAfterSaving = false;
		}
		if (exitAfterSaving == true) {
			//load the programmer facing page.
			window.location = "./programmer_facing.html";
		}
	}
	
	var createScript = function (scriptObject) {
		console.log('this is called too');
		scriptParseObject = scriptObject;
		//add the creator to the list of users
		UserScript.createUserScript(currentUser, scriptParseObject, finishSave);
	}
	
	var createOrEditScriptFromScriptData = function(theScriptData) {
		console.log("create or edit called...");
		if (scriptParseObject == undefined) {
			console.log("creating...");
			Script.createScript(currentUser, $("#theScriptName").val(), theScriptData, createScript);
		} else {
			console.log("saving edits...");
			scriptParseObject.editScript({scriptData: theScriptData, name: $("#theScriptName").val(), callback: finishSave});
		}
	}
	
	//saveBeforeExit - on the popup if hit cancel
	$("#yesSaveBeforeExit").click(function(e) {
		exitAfterSaving = true;
		saveTheScript();
	});
	
	//clicking save on the main screen
	$("#saveBtn").click(function (e) {
		saveTheScript();
	});
	
	//clicking save as on the main screen
	$("#saveAsBtnPopup").click(function(e) {
		var theName = $("#saveAsName").val();
		$("#theScriptName").val(theName);
		if (scriptParseObject == undefined) {
			saveTheScript(); //effectively equivalent to saving the script. don't mind the asynchronous naming...
		} else {
			scriptParseObject.copyScript({owner: currentUser, name: theName, callback: createScript});
		}
	});
	
	//clicking save and share
//	$("#saveNshareBtn").click(function (e) { });
	
	//clicking share on the modal popup
	$("#share").click(function (e) {
		shareAfterSaving = true;
		saveTheScript();
	});
	
	//*****************************************************************************
	//General click even handling (for manually closing popovers or tooltips, etc.)
	//*****************************************************************************
	
	$('body').on('click', function (e) {
		
		//warning tooltip closing...
		if (e.target.id != "popupAddParameterBtn"
		&& e.target.id != "popupAddStaticTextBtn"
		&& e.target.id != "editStaticTextBtn") {
			console.log(e.target.id);
			if (currentOpenWarningTooltipObject != undefined) {
				currentOpenWarningTooltipObject.tooltip("hide");
			}
		}
		
		//popover closing...
		if (!$(e.target).hasClass("popoverButton")) {
			$('.chunk').each(function () {
				//the 'is' for buttons that triggers popups
				//http://jsfiddle.net/mattdlockyer/ZZXEj/
				if (!$(this).is(e.target)) {
					$(this).popover('hide');
				}
			}); 
		//popover click processing (for edit/delete static text or parameters)
		} else {
			console.log("popover click");
			var theButton = $(e.target);
			//edit
			if (theButton.hasClass("popoverEditButton")) {
				var targetid = theButton.attr("targetid");
				console.log(theButton.attr("targetid"));
				//if static text...
				if (theButton.hasClass("staticTextChunkPopover")) {
					$('#staticTextInput').val($("#"+targetid).html());
					$('#popupAddStaticTextBtn').attr("targetid",targetid);
					$('#staticTextWindowHeader').html("Edit segment of static text");
					$('#popupAddStaticTextBtn').html("Edit Static Text");
					$("#staticTextWindow").attr("addOrEdit","edit");
					$('#staticTextWindow').modal('show');
				}
				
				//if parameter
				if (theButton.hasClass("parameterChunkPopover")) {
					theParamInstance = parametersInstanceLookup[targetid];
					$('#aliasInput').val(theParamInstance.get("alias"));
					$('#prefixFlagInput').val(theParamInstance.get("prefixFlag"));
					$('#ufNameInput').val(theParamInstance.get("userFriendlyName"));
					selectedTyp = theParamInstance.get("inputType");
					if (theParamInstance.get("required")) {
						$("#requiredInput").prop("checked", 1);
					}
					$("#typeInput option[value='"+selectedTyp+"']")[0].selected=true; //select type in dropdown option
					if (selectedTyp == InputType.BOOLEAN) {
						if (theParamInstance.get("defaultVal")=="on") {
							$("#defaultValInput").prop("checked", 1);
						}
					} else {
						$("#defaultValInput").val(theParamInstance.get("defaultVal"));
					}
					$("#warningsInput").val(theParamInstance.get("warnings"));
					$("#tooltipInput").val(theParamInstance.get("tooltip"));
					$("#addParamWindow").attr("addOrEdit", "edit");
					$("#popupAddParameterBtn").attr("targetid", targetid);
					
					$("#addParamWindowHeader").html("Edit Parameter/Flag");
					$("#popupAddParameterBtn").html("Save Edits");
					
					$("#addParamWindow").modal('show');
				}
				
			//delete
			} else if (theButton.hasClass("popoverDeleteButton")) {
				var targetId = theButton.attr("targetid");
				$('#'+targetId).popover('hide')
				$('#'+targetId).remove();
				if (theButton.hasClass("staticTextChunkPopover")) {
					var parseObject = staticTextInstanceLookup[targetId];
					parseObject.deleteStaticText();
					delete staticTextInstanceLookup[targetId];
				} else if (theButton.hasClass("parameterChunkPopover")){
					var parseObject = parametersInstanceLookup[targetId];
					parseObject.deleteParameter();
					//delete from table.
					$("#"+targetId+"_row").remove();
					if ($("#paramsTableBody").html() == "") {
						$("#paramsTable").css("display","none");
					}
					delete parametersInstanceLookup[targetId];
				}
			}
		}
	});
	
});

