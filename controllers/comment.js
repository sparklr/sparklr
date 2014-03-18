CONTROLLERS['comment'] = {};
CONTROLLERS['comment'].before = function(data, fragments) {
	data.canEdit = ISMOD || data.from == CURUSER;
}
