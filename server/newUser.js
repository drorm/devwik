// Validate username, sending a specific error message on failure.
Accounts.validateNewUser(function (user) {
	var blockedNames = Devwik.BlockedNames;
	for (ii = 0; ii < blockedNames.length; ii++) {
		if (user.username == blockedNames[ii]) {
			throw new Meteor.Error(403, "Username already exists");
		}
	}
	if(!user.username.match(/^[a-z0-9]*$/)) {
			throw new Meteor.Error(403, "User names can only have lower-case letters and numbers");
	}
	return true;
});
