/* Sparklr
 * Feedback system
 */

function sendFeedback(msg) {
	if (msg == "") return;
	hideAllPopups();
	ajax("work/feedback", { msg: msg }, function() {
		showBanner("Your feedback has been sent successfully.", "feedbackbanner", 5000);
	});
}
function showFeedbackForm() {
	showPopup(_g("feedback").innerHTML);
}
