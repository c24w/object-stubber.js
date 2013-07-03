define(function () {

	var stubbedObjects = [];

	function hasStubs(subject) { return stubbedObjects.indexOf(subject) !== -1; }

	function setHasStubs(subject) { if (stubbedObjects.indexOf(subject) === -1) { stubbedObjects.push(subject); } }

	function setHasNoStubs(subject) { stubbedObjects.splice(stubbedObjects.indexOf(subject), 1); }

	function hasOwnProperties(obj) {
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				return true;
			}
		}
		return false;
	}

	function updateHasStubsStatus(stubber) {
		if (hasOwnProperties(stubber.shallowBackups) || hasOwnProperties(stubber.nestedStubbers)) {
			return setHasStubs(stubber.subject);
		}

		setHasNoStubs(stubber.subject);
	}

	function traverseTo(rootObj, nestings) {
		var current = rootObj;
		var nesting;

		while ((nesting = nestings.shift()) !== undefined) {
			current = current[nesting];
		}

		return current;
	}

	function arrayify(subject) { return typeof subject === 'array' ? subject : [subject]; }

	function getNestedStubberKey(nestings) { return JSON.stringify(nestings); }

	// Temporarily stub functions on a fully-functional object.
	// CAUTION: make sure to un-stub when cleaning up after a test, otherwise
	// any subsequent new ObjectStubber on the same object will treat the old
	// stubs as its original functions (TODO: warn if this happens).
	// subject - object to stub
	function ObjectStubber(subject) {
		this.shallowBackups = {};
		this.nestedStubbers = {};
		this.subject = subject;
		if (hasStubs(subject)) {
			throw new Error('Cannot create ObjectStubber (subject object still has active stubs from a previous ObjectStubber).');
		}
	}

	ObjectStubber.prototype.stubShallow = function (fnName, newFn) {
		// only back-up if not already backed-up
		this.shallowBackups[fnName] = this.shallowBackups[fnName] || this.subject[fnName];
		this.subject[fnName] = newFn;
		updateHasStubsStatus(this);
	};

	// nestings: 'singleNesting' or ['multiple', 'levels', 'of', 'nesting']
	ObjectStubber.prototype.stubDeep = function (nestings, fnName, newFn) {
		var nestedStubberKey, nestedStubber;
		var nestedStubbers = this.nestedStubbers;
		nestings = arrayify(nestings);

		nestedStubberKey = getNestedStubberKey(nestings);

		var nestedObj = traverseTo(this.subject, nestings);
		// use existing nested stubber if available
		nestedStubber = nestedStubbers[nestedStubberKey] || new ObjectStubber(nestedObj);
		nestedStubber.stubShallow(fnName, newFn);

		nestedStubbers[nestedStubberKey] = nestedStubber;
		updateHasStubsStatus(this);
	};

	// delegates to stubDeep/stubShallow
	ObjectStubber.prototype.stub = function (nestings, fnName, newFn) {
		if (arguments.length === 2) {
			newFn = fnName;
			fnName = nestings;
			return this.stubShallow(fnName, newFn);
		}

		return this.stubDeep(nestings, fnName, newFn);
	};

	ObjectStubber.prototype.unStubShallow = function (fnName) {
		var shallowBackups = this.shallowBackups;
		if (fnName in shallowBackups) {
			this.subject[fnName] = shallowBackups[fnName];
			delete shallowBackups[fnName];
			updateHasStubsStatus(this);
		}
		else { throw new Error('Cannot un-stub \'' + fnName + '\' (it has not been stubbed).'); }
	};

	ObjectStubber.prototype.unStubDeep = function (nestings, fnName) {
		var nestedStubberKey, nestedStubber;
		nestings = arrayify(nestings);

		nestedStubberKey = getNestedStubberKey(nestings);
		nestedStubber = this.nestedStubbers[nestedStubberKey];

		nestedStubber.unStub(fnName);

		delete this.nestedStubbers[nestedStubberKey];
		updateHasStubsStatus(this);
	};

	// delegates to unStubDeep/unStubShallow
	ObjectStubber.prototype.unStub = function (nestings, fnName) {
		if (arguments.length === 1) {
			fnName = nestings;
			return this.unStubShallow(nestings, fnName);
		}

		return this.unStubDeep(nestings, fnName);
	};

	ObjectStubber.prototype.unStubAllShallow = function () {
		var shallowBackups = this.shallowBackups;
		for (var fnName in shallowBackups) {
			if (shallowBackups.hasOwnProperty(fnName)) {
				this.unStub(fnName);
			}
		}
	};

	ObjectStubber.prototype.unStubAllDeep = function () {
		var nestedStubbers = this.nestedStubbers;
		for (var stubberKey in nestedStubbers) {
			if (nestedStubbers.hasOwnProperty(stubberKey)) {
				var stubber = nestedStubbers[stubberKey];
				stubber.unStubAll();
				delete nestedStubbers[stubberKey];
			}
		}
	};

	ObjectStubber.prototype.unStubAll = function () {
		this.unStubAllShallow();
		this.unStubAllDeep();
	};

	// revisit 'wrap'

	ObjectStubber.prototype.unWrap = ObjectStubber.prototype.unStub;

	// Same as stub, but expects the callback to return the newFn.
	// The callback receives the original/'real' function as its argument.
	ObjectStubber.prototype.wrap = function (fnName, callback) {
		var realFn = this.subject[fnName];
		var newFn = callback(realFn);
		this.stub(fnName, newFn);
	};

	return ObjectStubber;
});