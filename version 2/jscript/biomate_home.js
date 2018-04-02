Parse.$ = jQuery;

Parse.initialize("C9TPknemAEmJzz1xcKFbBC855l64A4T4R2EFjxBH", "iJGffHXEvURl0BDlT0PeeL7ex2s0qT7uJA6BJvEV");

var translate = function(btnName){
	if(btnName == "btnUseScript")
		return "runScript";
	else if(btnName == "btnHistory")
		return "history";
	else if(btnName == "btnNotes")
		return "notes";
	else if(btnName == "btnCreateScript")
		return "createScript";
	
}


var currentUser = Parse.User.current();
if (currentUser == null) {
	var logInUrl = "biomate_login.html";
	if ($.getUrlVar('scriptId')) {
		//Show the notification
		logInUrl = logInUrl + "?scriptId=" + $.getUrlVar('scriptId');
		//alert(logInUrl);
	} else {
		//alert("nothing");
	}
	window.location = logInUrl;
}

else{
$(document).ready(function(){

	//Arrange the icons in a circle centered in the div
	numItems = $( "#divCircle button" ).length; //How many items are in the circle?
	
	start = 0; //the angle to put the first image at. a number between 0 and 2pi
	step = (2*Math.PI)/numItems; //calculate the amount of space to put between the items.
	console.log(numItems, step);
	//Now loop through the buttons and position them in a circle
	$( "#divCircle button" ).each(function( index ) {
		radius = ($("#divCircle").width() - $(this).width())/2; //The radius is the distance from the center of the div to the middle of an icon
		//the following lines are a standard formula for calculating points on a circle. x = cx + r * cos(a); y = cy + r * sin(a)
		//We have made adjustments because the center of the circle is not at (0,0), but rather the top/left coordinates for the center of the div
		//We also adjust for the fact that we need to know the coordinates for the top-left corner of the image, not for the center of the image.
		tmpTop = (($("#divCircle").height()/2) + radius * Math.sin(start)) - ($(this).height()/2);
		tmpLeft = (($("#divCircle").width()/2) + radius * Math.cos(start)) - ($(this).width()/2);
		start += step; //add the "step" number of radians to jump to the next icon
		console.log($(this).height(), $(this).width(), index, tmpTop,tmpLeft);
		//set the top/left settings for the image
		$(this).css("top",tmpTop);
		$(this).css("left",tmpLeft);
	});

	//set the highlight and bubble default based on the homepageGridDefault class
	currentGridSelector = null;

	//Setup the grid to change the highlighted bubble on mouseover ans click
	$("#divCircle button").mouseover(function(){
		//if the selected option has changed, deactivate the current selection
		if(currentGridSelector != $(this).attr("id"))
		{
			$("#" + translate(currentGridSelector)).attr("src", "../images/"+ translate(currentGridSelector) + "-off.png");
		}
		//turn on the new selection
		$("#"+translate($(this).attr("id"))).attr("src", "../images/"+ translate($(this).attr("id")) + "-on.png");
		//set the content of the center bubble
		currentGridSelector = $(this).attr("id");
	});

	$("#divCircle button").mouseout(function(){
		//if the selected option has changed, deactivate the current selection
		if(currentGridSelector != $(this).attr("id"))
		{
			$("#" + translate(currentGridSelector)).attr("src", "../images/"+ translate(currentGridSelector) + "-on.png");
			currentGridSelector = null;		
		}
		//turn on the new selection
		$("#"+translate($(this).attr("id"))).attr("src", "../images/"+ translate($(this).attr("id")) + "-off.png");
		//currentGridSelector = null;
	});
	
	var currentBtn = null;
	
	$("#btnUseScript").click(function(e){
		window.location="lab_bench_view.html";
	});
	
	$("#btnHistory").click(function(e){
		$("#historyTableBody").empty();
        History.getUserHistory(currentUser, 10, loadHistory);
	});
	
	$("#btnNotes").click(function(e){
		$("#notesTableBody").empty();
        	Note.getUserNotes(currentUser, loadNotes);
	});
	
	$("#btnCreateScript").click(function(e){
		window.location="programmer_facing.html";
	});
	
	var curScName = "";
	var collName = "";
	var sName = document.getElementById("curScriptName");
	var cName = document.getElementById("collabName");
	if ($.getUrlVar('scriptId')) {
		//Show the notification
		var sid = $.getUrlVar('scriptId');
		Script.getScriptById(sid, function(script){
			curScName = script.get("name");
			collName = script.get("owner").get("name");
			console.log(curScName, collName);
			cName.innerHTML = collName;
			sName.innerHTML = curScName;
			$("#notify").modal("show");
			UserScript.getUserScriptByUserScript(currentUser, script, function(userScript){
				if(!userScript)
					UserScript.createUserScript(currentUser, script, function(){console.log(sid + " created!!");});
			});
		});
		
	} else {
		//alert("nothing");
	}
	
	var userSpan = document.getElementById("userName");
	userSpan.innerHTML = currentUser.get("name");
	
	$("#btnSignOut").click(function(e){
		Parse.User.logOut();
		window.location = "biomate_login.html";
	});
	
    // callback to load user history
    function loadHistory(history) {
        var len = history.length;
        for(var i = 0; i < len; ++i) {
            var hist = history[i];
            var script = hist.get("script");
            var owner = script.get("owner");
            $("#historyTableBody").append(
                "<tr scriptId='" + script.id + "'><td>" + script.get("name") +
                "</td><td>" + owner.get("name") +
                "</td><td>" + dateToStringForHistory(hist.createdAt) +
                "</td><td>" + (owner.id === currentUser.id ? "<a href='programmer_facing.html?scriptId=" + script.id + "'>Edit</a> &nbsp " : "") + 
                "<a href='lab_bench_view.html?scriptId=" + script.id + "'>Use Script</a>" + 
                "</td></tr>");
        }
        $("#historyTable").modal("show");
    }
	
    // callback to load user notes
    function loadNotes(notes) {
        var len = notes.length;
        for(var i = 0; i < len; ++i) {
            var note = notes[i];
            var script = note.get("script");
            var owner = script.get("owner");
            $("#notesTableBody").append(
                "<tr noteId='" + note.id + "'><td>Note on " + script.get("name") +
                "</td><td>" + owner.get("name") +
                "</td><td>" + dateToStringForHistory(note.updatedAt) +
                "</td></tr>");
        }
        $("#noteTable").modal("show");
    }
	
	// show the text for a specific note
	$(document).on("click", "#notesTableBody tr", function () {
        var noteId = $(this).attr("noteId");
        Note.getNoteById(noteId, loadNote);
	});
    
    // store the current note so it can be edited
    var currentNote = null;
    
    // callback to show a specific note
    function loadNote(note) {
        currentNote = note;
        var script = note.get("script");
        var owner = script.get("owner");
        var text = note.get("text");
        $("#noteHeader").html("Note on " + script.get("name") + " (" + owner.get("name") + ")");
        $("#noteText").val(text);
		$("#noteTextPopup").modal();
		$("#noteTable").modal("hide");
    }
    
    // save edits to the note
    $("#saveNoteBtn").click(function () {
        if(currentNote) {
            currentNote.editNote({ text: $("#noteText").val(), callback: function (note) {}});
        }
    });
});
}
