Parse.$ = jQuery;
Parse.initialize("C9TPknemAEmJzz1xcKFbBC855l64A4T4R2EFjxBH", "iJGffHXEvURl0BDlT0PeeL7ex2s0qT7uJA6BJvEV");

$.extend({
	getUrlVars : function() {
		var vars = [], hash;
		var hashes = window.location.href.slice(
				window.location.href.indexOf('?') + 1).split('&');
		for ( var i = 0; i < hashes.length; i++) {
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	},
	getUrlVar : function(name) {
		return $.getUrlVars()[name];
	}
});

$(document).ready(function(){
	var signUpUrl = "biomate_signup.html";
	var homeUrl = "biomate_home.html";
	if ($.getUrlVar('scriptId')) {
		//Show the notification
		signUpUrl = signUpUrl + "?scriptId="+$.getUrlVar('scriptId');
		homeUrl = homeUrl + "?scriptId="+$.getUrlVar('scriptId');
		//alert(homeUrl);
	} else {
		//alert("nothing");
	}			   
	$("#btnSignUp").click(function() {
		window.location=signUpUrl;
	});
	$("#btnSignIn").click(function() {
		userName = $("#userName").val();
		userPassword = $("#userPassword").val();
		
		Parse.User.logIn(userName, userPassword, {
		  success: function(user) {
			// Do stuff after successful login.
			window.location = homeUrl;
		  },
		  error: function(user, error) {
			// The login failed. Check error to see why.
			self.$("#err").html(error.message).show();
		  }
		});
		return false;
	});
	$("#send").click(function(e){
		email = $("#userEmail").val();
		alert(email);
		Parse.User.requestPasswordReset(email, {
			success: function() {
				alert("Password reset request was sent successfully");
				self.$("#trouble").modal('hide');
			},
			error: function(error) {
				// Show the error message somewhere
				self.$("#sendErr").html(error.message).show();
			}
		});
	});
});
