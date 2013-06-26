function sendFeedback(msg) {
	ajaxGet("work/feedback", { msg: msg }, function() {
		_g("feedback").style.display = "none";
		showBanner("Your feedback has been sent successfully.", "feedbackbanner", 5000);
	});
}
function showFeedbackForm() {
	_g("feedback").style.display = "block";
}
