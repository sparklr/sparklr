function sendFeedback(msg) {
	if (msg == "") return;
	hideAllPopups();
	ajaxGet("work/feedback", { msg: msg }, function() {
		showBanner("Your feedback has been sent successfully.", "feedbackbanner", 5000);
	});
}
function showFeedbackForm() {
	//TODO
}
