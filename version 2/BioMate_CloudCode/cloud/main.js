
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

Parse.Cloud.define("sendMail", function(request, response) {
	var Mailgun = require('mailgun');
	Mailgun.initialize('biomate.mailgun.org', 'key-4k51f079cyi4zrcg1bscan6z-mhfie-9');
	Mailgun.sendEmail({
	  to: request.params.toAddress,
	  from: "BioMate@biomate.mailgun.org",
	  subject: "A new script has been shared with you",
	  text: "Go to the following link to access the new script\nhttp://google.com?scriptId=" + request.params.scriptId
	}, {
	  success: function(httpResponse) {
		console.log(httpResponse);
		response.success("Email sent!" + request.params.scriptId);
	  },
	  error: function(httpResponse) {
		console.error(httpResponse);
		response.error("Uh oh, something went wrong");
	  }
	});
});
