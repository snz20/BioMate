var setScriptToSelect = function(scriptName, owner, scriptId) {
	var currentUserName = Parse.User.current().get("name");
	if(currentUserName == owner)
		$("#inputScript").append("<option value='" + scriptId + "'>"+scriptName+"</option>");
	else
		$("#inputScript").append("<option value='" + scriptId + "'>"+scriptName + " (shared by " + owner +")</option>");
}

var setSelectedScript = function(scriptId) {
    $("#inputScript").val(scriptId);
}

var initializeLoadScript = function(scriptName) {
	$(".scriptName").html(scriptName);
	$("#loadParamsTableBody").html("");
	$("#required").html("");
	$("#optional").html("");
}

var setNoteContents = function(noteContents) {
	$("#noteContents").val(noteContents);
}

var getNoteContents = function() {
	return $("#noteContents").val();
}

var setInstructionsContents = function(instructionsContents) {
	var lines = instructionsContents.split("\n");
	$("#instructionsContents").html("");
	$.each(lines, function(i) {
		$("#instructionsContents").append("<p>"+lines[i]+"</p>");
	});
}

var addRowToLoadParamsTable = function (id, savedParametersName, date) {
	$("#loadParamsTableBody").append(
        "<tr paramsId='" + id + "'> <td>" + savedParametersName + 
        "</td><td>" + dateToStringForHistory(date) + "</td></tr>");
} 

var setCaveats = function(caveats) {
	$("#caveats").html(caveats);
}

var setGeneratedCommand = function(command) {
	$("#commandText").html(command);
}

var getGeneratedCommand = function() {
	return $("#commandText").text();
}

var addInputParameter = function(inputId, alias, userFriendlyName, defaultVal, tooltip, warning, isRequired) {
	var toAppendTo;
	if (isRequired) {
		toAppendTo = $("#required");
	} else {
		toAppendTo = $("#optional");
	}
	//var inputId = "inputParam_"+alias;
	var warningText = "";
	if (warning != "") {
		warningText = "<span class='span10 offset3 text-warning'>"+warning+"</span>";
	}
	
	toAppendTo.append(
		"<div class='row'>"+
			"<div class='span3 truncate'>"+
				"<label for='"+inputId+"' tabIndex='-1' "+(tooltip==""?"style='padding-left: 40px'":"")+">"+
					((tooltip=="")?"":"<a href='#' data-toggle='tooltip' title='"+tooltip+"' class='btn btn-link info' tabIndex='-1'>"+"<i class='icon-question-sign' tabIndex='-1'></i>"+"</a>")+
					userFriendlyName+
				"</label>"+
			"</div>"+
			"<div class='span9'>"+
				"<input id='"+inputId+"' class='input-block-level' type='text''></input>"+
			"</div>"+
			warningText+
		"</div>"
	);
	
	//if is required, do placeholder
	if (isRequired) {
		$("#"+inputId).attr("placeholder", defaultVal);
	} else {
		$("#"+inputId).val(defaultVal);
		$("#"+inputId).click(function() {
			this.select();
		});
	}
}

var addFlag = function(inputId, alias, userFriendlyName, defaultVal, tooltip, warning) {
	//var inputId = "inputParam_"+alias;
	var warningText = "";
	if (warning != "") {
		warningText = "<span class='span10 offset3 text-warning'>"+warning+"</span>";
	}
	console.log("tooltip"+tooltip);
	$("#optional").append(
		"<div class='row'>"+
			"<div class='span3 truncate'>"+
				"<label for='"+inputId+"' tabIndex='-1' "+(tooltip==""?"style='padding-left: 40px'":"")+">"+
					((tooltip=="")?"":"<a href='#' data-toggle='tooltip' title='"+tooltip+"' class='btn btn-link info' tabIndex='-1'>"+"<i class='icon-question-sign' tabIndex='-1'></i>"+"</a>")+
					userFriendlyName+
				"</label>"+
			"</div>"+
			"<div class='span9'>"+
				"<input id='"+inputId+"' type='checkbox'></input>"+
			"</div>"+
			warningText+
		"</div>"
	);

	if (defaultVal == "on") {
		$("#"+inputId).prop("checked",1);
	}
}

var getInputParameters = function() {
    var paramsMap = {};
    
    var optional = $("#optional :input");
    var lenOpt = optional.length;
    for(var i = 0; i < lenOpt; ++i) {
        var param = optional[i];
        var value = "";
        var id = $(param).attr("id");
        if($(param).is(":checkbox")) {
            value = $(param).is(":checked");
        }
        else {
            value = $(param).val();
        }
        
        if(value) {
            paramsMap[id] = value;
        }
    }
    
    var required = $("#required :input");
    var lenReq = required.length;
    for(var i = 0; i < lenReq; ++i) {
        var param = required[i];
        var value = "";
        var id = $(param).attr("id");
        if($(param).is(":checkbox")) {
            value = $(param).is(":checked");
        }
        else {
            value = $(param).val();
        }
        
        // @todo - for required parameters value should always exist
        if(value) {
            paramsMap[id] = value;
        }
    }
    
    return paramsMap;
}

var setInputParameters = function(paramsMap) {
    var optional = $("#optional :input");
    var lenOpt = optional.length;
    for(var i = 0; i < lenOpt; ++i) {
        var param = optional[i];
        var id = $(param).attr("id");
        var value = paramsMap[id];
        if($(param).is(":checkbox")) {
            if(value === "on") {
                $(param).prop("checked", true);
            }
            else {
                $(param).prop("checked", false);
            }
        }
        else {
            if(value) {
                $(param).val(value);
            }
        }
    }
    
    var required = $("#required :input");
    var lenReq = required.length;
    for(var i = 0; i < lenReq; ++i) {
        var param = required[i];
        var id = $(param).attr("id");
        var value = paramsMap[id];
        if($(param).is(":checkbox")) {
            if(value === "on") {
                $(param).prop("checked", true);
            }
            else {
                $(param).prop("checked", false);
            }
        }
        else {
            if(value) {
                $(param).val(value);
            }
        }
    }
}
