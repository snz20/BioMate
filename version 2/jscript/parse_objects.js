Parse.initialize("C9TPknemAEmJzz1xcKFbBC855l64A4T4R2EFjxBH", "iJGffHXEvURl0BDlT0PeeL7ex2s0qT7uJA6BJvEV");

var CommandChunkType = { 
	STATIC_TEXT: "static_text", 
	PARAMETER: "parameter" 
};

var InputType = {
	INT: "Integer",
	FLOAT: "Float",
	STRING: "String",
	BOOLEAN: "Flag"
};

var Script = Parse.Object.extend("Script", {
    // Instance properties
    
    // Edit this script
    // optionally pass either name, script data, or both
    // optionally pass in a callback function on successful save
    editScript: function(args) {
        if(args && args.name) this.set("name", args.name);
        if(args && args.scriptData) this.set("privateScriptData", args.scriptData);
        this.save({
            success: function(script) {
                if(args && args.callback) args.callback(script);
            },
            error: function(script, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Share the script by making the private script data
    // public and available to all users with whom the script is shared
    // optionally pass in a callback function on successful save
    shareScript: function(args) {
        var scriptData = this.get("privateScriptData");
        this.set("publicScriptData", scriptData.clone());
        this.save({
            success: function(script) {
                if(args && args.callback) args.callback(script);
            },
            error: function(script, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Delete this script
    // optionally pass in a callback function on successful deletion
    deleteScript: function(args) {
        this.destroy({
            success: function(script) {
                if(args && args.callback) args.callback(script);
            },
            error: function(script, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }, 
    
    // Create a copy of this script with a new owner and/or
    // a new name
    // optionally pass in a callback function on successful save
    copyScript: function(args) {
        var newScript = this.clone();
        if(args && args.owner) newScript.set("owner", args.owner);
        if(args && args.name) newScript.set("name", args.name);
        newScript.save({
            success: function(script) {
                if(args && args.callback) args.callback(script);
            },
            error: function(script, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
}, {
    // Class properties
    
    // Create a new script
    // @param owner: the owner of the script, type Parse.User
    // @param name: the name of the script, type string
    // @param scriptData: the script data, type ScriptData
    // @param callback: a function to call upon successful creation
    createScript: function(owner, name, scriptData, callback) {
        var script = new Script();
        script.set("owner", owner);
        script.set("name", name);
        script.set("privateScriptData", scriptData);
        script.save({
            success: function(script) {
                callback(script);
            },
            error: function(script, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get all the scripts for a given owner
    // results are returned via the callback function
    getOwnerScripts: function(owner, callback) {
        var query = new Parse.Query(Script);
        query.equalTo("owner", owner);
        query.find({
            success: function(ownerScripts) {
                callback(ownerScripts);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the script matching a given name and owner, if it exists
    // results are returned via the callback function
    getScriptByOwnerName: function(owner, name, callback) {
        var query = new Parse.Query(Script);
        query.equalTo("owner", owner);
        query.equalTo("name", name);
        query.first({
            success: function(script) {
                callback(script);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the script matching a given id, if it exists
    // results are returned via the callback function
    getScriptById: function(id, callback) {
        var query = new Parse.Query(Script);
        query.include("owner");
        query.include("privateScriptData.chunks.parameter");
        query.include("publicScriptData.chunks.parameter");
        query.include("privateScriptData.chunks.staticText");
        query.include("publicScriptData.chunks.staticText");
        query.get(id, {
            success: function(script) {
                callback(script);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
});

var UserScript = Parse.Object.extend("UserScript", {
    // Instance properties
    
    // Delete this user's instance of the script
    // optionally pass in a callback function on successful deletion
    deleteUserScript: function(args) {
        this.destroy({
            success: function(userScript) {
                if(args && args.callback) args.callback(userScript);
            },
            error: function(userScript, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }, 
    
    // Create a copy of this script with the user as the owner of the new copy
    // optionally pass in a callback function on successful save
    copyUserScript: function(args) {
        var script = this.get("script");
        if(!args) args = {};
        args.owner = this.get("user");
        script.copyScript(args);
    }
}, {
    // Class properties
    
    // Add a script to the list of a user's runnable scripts
    // @param user: the user, type Parse.User
    // @param script: a reference to the script, type Script
    // @param callback: a function to call upon successful creation
    createUserScript: function(user, script, callback) {
        var userScript = new UserScript();
        userScript.set("user", user);
        userScript.set("script", script);
        userScript.save({
            success: function(userScript) {
                callback(userScript);
            },
            error: function(userScript, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get all the scripts for a given user
    // results are returned via the callback function
    getUserScripts: function(user, callback) {
        var query = new Parse.Query(UserScript);
        query.equalTo("user", user);
        query.include("script");
	query.include("script.owner");
        query.include("script.id");
	query.find({
            success: function(userScripts) {
		callback(userScripts);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
	
    },
    
    // Get a UserScript for a given user and script if it exists
    // results are returned via the callback function
    getUserScriptByUserScript: function(user, script, callback) {
        var query = new Parse.Query(UserScript);
        query.equalTo("user", user);
        query.equalTo("script", script);
        query.first({
            success: function(userScript) {
                callback(userScript);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the user-script matching a given id, if it exists
    // results are returned via the callback function
    getUserScriptById: function(id, callback) {
        var query = new Parse.Query(UserScript);
        query.get(id, {
            success: function(userScript) {
                callback(userScript);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
});

var History = Parse.Object.extend("History", {
    // Instance properties
    
}, {
    // Class properties
    
    // Add an entry to a user's history
    // @param user: the user, type Parse.User
    // @param script: a reference to the script, type Script
    // @param callback: a function to call upon successful creation
    createHistory: function(user, script, callback) {
        var history = new History();
        history.set("script", script);
        history.set("user", user);
        history.save({
            success: function(history) {
                callback(history);
            },
            error: function(history, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the history for a given user
    // to get all history, set limit = -1, otherwise return the 
    // k most recent results up to the limit
    // results are returned via the callback function
    getUserHistory: function(user, limit, callback) {
        var query = new Parse.Query(History);
        query.equalTo("user", user);
        query.descending("createdAt");
        query.include("script.owner");
        if(limit > 0) query.limit(limit);
        query.find({
            success: function(history) {
                callback(history);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the history entry matching a given id, if it exists
    // results are returned via the callback function
    getHistoryById: function(id, callback) {
        var query = new Parse.Query(History);
        query.get(id, {
            success: function(history) {
                callback(history);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
});

var Note = Parse.Object.extend("Note", {
    // Instance properties
    
    // Edit the text of this note
    // optionally pass in a callback function on successful save
    editNote: function(args) {
        if(args && args.text) this.set("text", args.text);
        this.save({
            success: function(note) {
                if(args && args.callback) args.callback(note);
            },
            error: function(note, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Delete this note
    // optionally pass in a callback function on successful deletion
    deleteNote: function(args) {
        this.destroy({
            success: function(note) {
                if(args && args.callback) args.callback(script);
            },
            error: function(note, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    } 

}, {
    // Class properties
    
    // Add a note for a particular user and script
    // @param user: the user, type Parse.User
    // @param script: a reference to the script, type Script
    // @param text: the text of the note, type string
    // @param callback: a function to call upon successful creation
    createNote: function(user, script, text, callback) {
        var note = new Note();
        note.set("user", user);
        note.set("script", script);
        note.set("text", text);
        note.save({
            success: function(note) {
                callback(note);
            },
            error: function(note, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get all the notes for a given user
    // results are returned via the callback function
    getUserNotes: function(user, callback) {
        var query = new Parse.Query(Note);
        query.equalTo("user", user);
        query.include("script.owner");
        query.descending("updatedAt");
        query.find({
            success: function(notes) {
                callback(notes);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the note for a given user and script, if it exists
    // results are returned via the callback function
    getNoteByUserScript: function(user, script, callback) {
        var query = new Parse.Query(Note);
        query.equalTo("user", user);
        query.equalTo("script", script);
        query.first({
            success: function(note) {
                callback(note);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the note matching a given id, if it exists
    // results are returned via the callback function
    getNoteById: function(id, callback) {
        var query = new Parse.Query(Note);
        query.include("script.owner");
        query.get(id, {
            success: function(note) {
                callback(note);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
});

var ScriptData = Parse.Object.extend("ScriptData", {
    // Instance properties
    
    // Edit the script data
    // optionally pass in a callback function on successful save
    editScriptData: function(args) {
        if(args && args.chunks) this.set("chunks", args.chunks);
        if(args && args.caveats) this.set("caveats", args.caveats);
        if(args && args.instructions) this.set("instructions", args.instructions);
        this.save({
            success: function(scriptData) {
                if(args && args.callback) args.callback(scriptData);
            },
            error: function(scriptData, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Delete the script data
    // optionally pass in a callback function on successful deletion
    deleteScriptData: function(args) {
        this.destroy({
            success: function(scriptData) {
                if(args && args.callback) args.callback(scriptData);
            },
            error: function(scriptData, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    } 

}, {
    // Class properties
    
    // Create script data
    // @param chunks: array of command parts, type CommandChunk[]
    // @param caveats: caveats for the user, type string
    // @param instructions: instructions for the user, type string
    // @param callback: a function to call upon successful creation
    createScriptData: function(chunks, caveats, instructions, callback) {
        console.log('create script data called');
        var scriptData = new ScriptData();
        scriptData.set("chunks", chunks);
        scriptData.set("caveats", caveats);
        scriptData.set("instructions", instructions);
        scriptData.save({
            success: function(scriptData) {
            	console.log('callback called');
                callback(scriptData);
            },
            error: function(scriptData, error) {
            	console.log("weird error");
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the script data matching a given id, if it exists
    // results are returned via the callback function
    getScriptDataById: function(id, callback) {
        var query = new Parse.Query(ScriptData);
        query.get(id, {
            success: function(scriptData) {
                callback(scriptData);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
});

var CommandChunk = Parse.Object.extend("CommandChunk", {
    // Instance properties
    
    // Edit the command chunk
    // optionally pass in a callback function on successful save
    editCommandChunk: function(args) {
        if(args && args.commandChunkType) this.set("commandChunkType", args.commandChunkType);
        if(args && args.chunkData) {
            if(this.get("commandChunkType") === CommandChunkType.STATIC_TEXT) {
                this.set("staticText", args.chunkData);
            }
            else {
                this.set("parameter", args.chunkData);
            }
        }
        this.save({
            success: function(commandChunk) {
                if(args && args.callback) args.callback(commandChunk);
            },
            error: function(commandChunk, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Delete the command chunk
    // optionally pass in a callback function on successful deletion
    deleteCommandChunk: function(args) {
        this.destroy({
            success: function(commandChunk) {
                if(args && args.callback) args.callback(commandChunk);
            },
            error: function(commandChunk, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    } 

}, {
    // Class properties
    
    // Create a command chunk
    // @param commandChunkType: the type of command chunk, type CommandChunkType
    // @param chunkData: the command chunk data, either type StaticText or Parameter
    // @param callback: a function to call upon successful creation
    createCommandChunk: function(commandChunkType, chunkData, callback) {
        var commandChunk = new CommandChunk();
        commandChunk.set("commandChunkType", commandChunkType);
        if(commandChunkType === CommandChunkType.STATIC_TEXT) {
            commandChunk.set("staticText", chunkData);
        }
        else {
            commandChunk.set("parameter", chunkData);
        }
        commandChunk.save({
            success: function(commandChunk) {
                callback(commandChunk);
            },
            error: function(commandChunk, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the command chunk matching a given id, if it exists
    // results are returned via the callback function
    getCommandChunkById: function(id, callback) {
        var query = new Parse.Query(CommandChunk);
        query.get(id, {
            success: function(commandChunk) {
                callback(commandChunk);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
});


var StaticText = Parse.Object.extend("StaticText", {
    // Instance properties
    
    // Edit the static text block
    // optionally pass in a callback function on successful save
    editStaticText: function(args) {
        if(args && args.text) this.set("text", args.text);
        this.save({
            success: function(staticText) {
                if(args && args.callback) args.callback(staticText);
            },
            error: function(staticText, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Delete the static text block
    // optionally pass in a callback function on successful deletion
    deleteStaticText: function(args) {
        this.destroy({
            success: function(staticText) {
                if(args && args.callback) args.callback(staticText);
            },
            error: function(staticText, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    } 

}, {
    // Class properties
    
    // Create a static text block
    // @param text: the text of the static text block, type string
    // @param callback: a function to call upon successful creation
    createStaticText: function(text, callback) {
        var staticText = new StaticText();
        staticText.set("text", text);
        staticText.save({
            success: function(staticText) {
                callback(staticText);
            },
            error: function(staticText, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the static text block matching a given id, if it exists
    // results are returned via the callback function
    getStaticTextById: function(id, callback) {
        var query = new Parse.Query(StaticText);
        query.get(id, {
            success: function(staticText) {
                callback(staticText);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
    
});


var Parameter = Parse.Object.extend("Parameter", {
    // Instance properties
    
    // Edit the parameter
    // optionally pass in a callback function on successful save
    editParameter: function(args) {
        if(args && args.alias != undefined) this.set("alias", args.alias);
        if(args && args.prefixFlag != undefined) this.set("prefixFlag", args.prefixFlag);
        if(args && args.userFriendlyName != undefined) this.set("userFriendlyName", args.userFriendlyName);
        if(args && args.defaultVal != undefined) this.set("defaultVal", args.defaultVal);
        if(args && args.inputType != undefined) this.set("inputType", args.inputType);
        if(args && args.required != undefined) this.set("required", args.required);
        if(args && args.warnings != undefined) this.set("warnings", args.warnings);
        if(args && args.tooltip != undefined) this.set("tooltip", args.tooltip);
        this.save({
            success: function(parameter) {
                if(args && args.callback) args.callback(parameter);
            },
            error: function(parameter, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Delete the parameter
    // optionally pass in a callback function on successful deletion
    deleteParameter: function(args) {
        this.destroy({
            success: function(parameter) {
                if(args && args.callback) args.callback(parameter);
            },
            error: function(parameter, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    } 

}, {
    // Class properties
    
    // Create a new parameter
    // @param alias: an alias for the parameter, type string
    // @param prefixFlag: the parameter prefix or flag (e.g. -v), type string
    // @param userFriendlyName: name the user will see when entering data, type string
    // @param defaultVal: default value, type corresponds to InputType
    // @param inputType: the parameter data type, type InputType
    // @param required: whether or not the parameter is required, type boolean
    // @param warnings: warnings for the user, type string
    // @param tooltip: tooltip for the parameter, type string
    // @param callback: a function to call upon successful creation
    createParameter: function(alias, prefixFlag, userFriendyName, defaultVal,
                              inputType, required, warnings, tooltip, callback) {
        var parameter = new Parameter();
        parameter.set("alias", alias);
        parameter.set("prefixFlag", prefixFlag);
        parameter.set("userFriendlyName", userFriendyName);
        parameter.set("defaultVal", defaultVal);
        parameter.set("inputType", inputType);
        parameter.set("required", required);
        parameter.set("warnings", warnings);
        parameter.set("tooltip", tooltip);
        parameter.save({
            success: function(parameter) {
                callback(parameter);
            },
            error: function(parameter, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the parameter matching a given id, if it exists
    // results are returned via the callback function
    getParameterById: function(id, callback) {
        var query = new Parse.Query(Parameter);
        query.get(id, {
            success: function(parameter) {
                callback(parameter);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
});


var SavedParameter = Parse.Object.extend("SavedParameter", {
    // Instance properties
    
    // Delete this saved parameter value
    // optionally pass in a callback function on successful deletion
    deleteSavedParameter: function(args) {
        this.destroy({
            success: function(savedParameter) {
                if(args && args.callback) args.callback(savedParameter);
            },
            error: function(savedParameter, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    } 

}, {
    // Class properties
    
    // Create a saved parameter value
    // @param parameter: the parameter reference, type Parameter
    // @param value: the value of the parameter, type corresponds to inputType of parameter
    // @param save: if false, return the object and don't save it to the parse backend
    // @param callback: a function to call upon successful creation
    createSavedParameter: function(parameter, value, save, callback) {
        var savedParameter = new SavedParameter();
        savedParameter.set("parameter", parameter);
        savedParameter.set("value", value);
        if(!save) {
            return savedParameter;
        }
        savedParameter.save({
            success: function(savedParameter) {
                callback(savedParameter);
            },
            error: function(savedParameter, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the saved parameter value matching a given id, if it exists
    // results are returned via the callback function
    getSavedParameterById: function(id, callback) {
        var query = new Parse.Query(SavedParameter);
        query.get(id, {
            success: function(savedParameter) {
                callback(savedParameter);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
});

var SavedScriptParams = Parse.Object.extend("SavedScriptParams", {
    // Instance properties
    
    // Delete this set of saved script parameters
    // optionally pass in a callback function on successful deletion
    deleteSavedScriptParams: function(args) {
        this.destroy({
            success: function(savedScriptParams) {
                if(args && args.callback) args.callback(savedScriptParams);
            },
            error: function(savedScriptParams, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    } 

}, {
    // Class properties
    
    // Create a set of saved script parameters
    // @param user: the user, type Parse.User
    // @param script: reference to the script, type Script
    // @param savedParams: array of saved parameter values, type SavedParameter[]
    // @param name: the user-defined name for this set of saved script parameters, type string
    // @param callback: a function to call upon successful creation
    createSavedScriptParams: function(user, script, savedParams, name, callback) {
        var savedScriptParams = new SavedScriptParams();
        savedScriptParams.set("user", user);
        savedScriptParams.set("script", script);
        savedScriptParams.set("savedParams", savedParams);
        savedScriptParams.set("name", name);
        savedScriptParams.save({
            success: function(savedScriptParams) {
                callback(savedScriptParams);
            },
            error: function(savedScriptParams, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the saved script parameters for a given user and script
    // results are returned via the callback function
    getSavedScriptParamsByUserScript: function(user, script, callback) {
        var query = new Parse.Query(SavedScriptParams);
        query.equalTo("user", user);
        query.equalTo("script", script);
        query.descending("createdAt");
        query.find({
            success: function(savedScriptParams) {
                callback(savedScriptParams);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    },
    
    // Get the set of saved script parameters matching a given id, if it exists
    // results are returned via the callback function
    getSavedScriptParamsById: function(id, callback) {
        var query = new Parse.Query(SavedScriptParams);
        query.include("savedParams.parameter");
        query.get(id, {
            success: function(savedScriptParams) {
                callback(savedScriptParams);
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
});
