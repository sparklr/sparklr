/* Sparklr
 * ui.js: Mobile UI functionality only
 *
 */

function showDropdown() {
	var s = _g("dropdown");
	if (s.className == "visible")
		return hideDropdown();
	s.className = "visible";
	_g('dropdowncover').style.display = 'block';
	window.scrollTo(0,0);
}

function hideDropdown() {
	var s = _g("dropdown");
	s.className = "";
	_g('dropdowncover').style.display = 'none';
}

