/* Sparklr
 * Feedback system
 */

function sendFeedback(msg) {
	if (msg == "") return;
	hideAllPopups();

	msg += "\n" + navigator.userAgent;

	ajax("feedback", { msg: msg }, function() {
		showBanner("Your feedback has been sent successfully.", "feedbackbanner", 5000);
	});
}
function showFeedbackForm() {
	showPopup(_g("feedback").innerHTML);
}
