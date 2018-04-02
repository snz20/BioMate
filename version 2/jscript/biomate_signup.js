Parse.$ = jQuery;
Parse.initialize("C9TPknemAEmJzz1xcKFbBC855l64A4T4R2EFjxBH", "iJGffHXEvURl0BDlT0PeeL7ex2s0qT7uJA6BJvEV");

$(function(){
	var logInUrl = "biomate_login.html";
	if ($.getUrlVar('scriptId')) {
		//Show the notification
		logInUrl = logInUrl + "?scriptId=" + $.getUrlVar('scriptId');
		//alert(logInUrl);
	} else {
		//alert("nothing");
	}
	$("#btnSignUp").click(function(e){
		
		var email = $("#email").val();
		var password = $("#passwd").val();
        var name = $("#name").val();
		
		var user = new Parse.User();
		user.set("username", email);
		user.set("password", password);
		user.set("email", email);
        user.set("name", name);
		  
		user.signUp(null,{
		  success: function(user) {
			$('#success').modal('show')
			//window.location = "biomate_login.html";
		  },
		  error: function(user, error) {
			// Show the error message somewhere and let the user try again.
			self.$("#err").html(error.message).show();
		  }
		});
		
		return false;
	});
	$("#close1").click(function(e){
		window.location = logInUrl;
	});
	$("#close2").click(function(e){
		window.location = logInUrl;
	});
});
