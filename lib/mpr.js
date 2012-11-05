if(typeof inherits != 'function')
{
	inherits = function(ctor, superCtor)
	{
		ctor.super_ = superCtor;
		ctor.prototype = Object.create(superCtor.prototype, {
			constructor: {
				value: ctor,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
	};
}

var MprUnpacker = function(buf)
{
	self._fmt = '';
};

MprUnpacker.prototype.getProperties = function(values)
{
	var properties = [];
	for(var propertyName in this)
	{
		if (typeof this[propertyName] == 'function')
			continue;

		var c = propertyName.charAt(0);
		if (c == '_')
			continue;

		properties.push(propertyName);
	}

	return properties;
};

MprUnpacker.prototype.getNullTermdStr = function(str)
{
	// deal with null terminated string
	var idx = str.indexOf('\0');
	if (idx < 0)
		return str;

	return str.substr(0, idx);
};

MprUnpacker.prototype.unpack = function(buf)
{
	if (!buf)
		return;

	var self = this;

	var data = Struct.Unpack(self._fmt, buf, 0);

	var properties = this.getProperties();

	for (var i = 0; i < properties.length; i++)
	{
		var t = data[i];

		// automatically deal with null terminated strings
		if ((typeof data[i] == 'string') && (data[i].length > 0))
			t = self.getNullTermdStr(t);

		self[properties[i]] = t;
	}
}

var MprResult = function(buf)
{
	var self = this;

	self._fmt = '<24s8s4s24sHHBBHiiBBBB';

	self.name = '';
	self.plate = '';
	self.vehicle = '';
	self.license = '';
	self.laps = 0;
	self.playerflags = 0;
	self.confirmflags = 0;
	self.numstops = 0;
	self.penaltyseconds = 0;
	self.overalltime = 0;
	self.bestlaptime = 0;
	self.spare0 = 0;
	self.startposition = 0;
	self.handicap = 0;
	self.intakerestriction = 0;

	self.unpack(buf);
};

inherits(MprResult, MprUnpacker);

var Mpr = function(buf, file)
{
	var self = this;

	self._file = file;
	self._fmt = '<6sBBBBBBiiBBBB8s4si32sBBBBi';

	self.header = '';
	self.gameversion = 0;
	self.gamerevision = 0;
	self.mprversion = 0;
	self.immediatestart = 0;
	self.spare0 = 0;
	self.spare1 = 0;
	self.rules = 0;
	self.flags = 0;
	self.laps = 0;
	self.skill = 0;
	self.wind = 0;
	self.numplayers = 0;
	self.lfsversion = '';
	self.shorttrackname = '';
	self.starttime = 0;
	self.trackname = '';
	self.config = 0;
	self.reversed = 0;
	self.weather = 0;
	self.numresults = 0;
	self.spare2 = 0;

	self.results = [];

	self.unpack(buf);
}

inherits(Mpr, MprUnpacker);

Mpr.prototype.unpack = function(buf)
{
	if (!buf)
		return;

	var self = this;

	var data = Struct.Unpack(self._fmt, buf, 0);

	var properties = this.getProperties();

	// unpack the header
	for (var i = 0; i < properties.length; i++)
	{
		if (properties[i] == "results")
			continue;

		var t = data[i];

		// automatically deal with null terminated strings
		if ((typeof data[i] == 'string') && (data[i].length > 0))
			t = self.getNullTermdStr(t);

		self[properties[i]] = t;
	}

	// unpack the results
	for(var i = 0; i < self.numresults; i++)
	{
		// Next packet start position
		var start = 80 + (i * 80);

		var c = new MprResult(buf.subarray(start, start + 80));
		self.results.push(c);
	}
}
