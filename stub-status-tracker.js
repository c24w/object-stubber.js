define(function () {

	function StubStatusTracker() {
		this.stubbedObjects = [];
	}

	StubStatusTracker.prototype.isStubbed = function (subject) {
		return this.stubbedObjects.indexOf(subject) !== -1;
	};

	StubStatusTracker.prototype.setStubbed = function(subject, isStubbed) {
		if (isStubbed) { return this.setHasStubs(subject); }
		this.setHasNoStubs(subject);
	};

	function arrayContains(arr, obj) {
		return arry.indexOf(obj) !== -1;
	}

	StubStatusTracker.prototype.setHasStubs = function (subject) {
		if (!this.isStubbed(subject)) {
			this.stubbedObjects.push(subject);
		}
	};

	StubStatusTracker.prototype.setHasNoStubs = function(subject) {
		if (this.isStubbed(subject)) {
			this.stubbedObjects.splice(stubbedObjects.indexOf(subject), 1);
		}
	};

	return StubStatusTracker;

});