var module_utils = require("punch").Utils.Module;
var sitemap_generator = require('../lib/sitemap_generator.js');

describe("setup", function() {

	var sample_config = {
		plugins: {
			cache_store: "sample_cache_store"
		},

		sitemap_generator: {
			url_root: "http://example.com",
			exclude_urls: [ "http://example.com/private", "http://example.com/hidden" ],
			manual_entries: [ { "loc": "http://example.com/custom", "priority": "0.6", "lastmod": "2012-01-01", "changefreq": "yearly" } ]
		}
	};

	beforeEach(function() {
		spyOn(module_utils, "requireAndSetup").andCallFake(function(id, config){
			return {"id": id};
		});
	});

	it("set the url root", function() {
		sitemap_generator.setup(sample_config);

		expect(sitemap_generator.urlRoot).toEqual("http://example.com");
	});

	it("set the cache store", function() {
		sitemap_generator.setup(sample_config);

		expect(sitemap_generator.cacheStore.id).toEqual("sample_cache_store");
	});

	it("set the exclude urls", function() {
		sitemap_generator.setup(sample_config);

		expect(sitemap_generator.excludeUrls).toEqual([ "http://example.com/private", "http://example.com/hidden" ]);
	});

	it("add the manual entries to the url list", function() {
		sitemap_generator.setup(sample_config);

		expect(sitemap_generator.urls).toEqual([{ "loc": "http://example.com/custom", "priority": "0.6", "lastmod": "2012-01-01", "changefreq": "yearly" } ]);
	});

	it("use the default change frequency if no frequency is provided", function() {
		sitemap_generator.setup(sample_config);

		expect(sitemap_generator.changeFreq).toEqual("weekly");
	});

});

describe("running the hook", function() {

	it("add the given file to the list", function() {
		spyOn(sitemap_generator, "addUrl");

		var spyCallback = jasmine.createSpy();
		sitemap_generator.run("/path/page", { 'modified': false, 'finished': false }, spyCallback);

		expect(sitemap_generator.addUrl).toHaveBeenCalledWith("/path/page", spyCallback);
	});

	it("create the sitemap when generation process is finished", function() {
		spyOn(sitemap_generator, "createSitemap");

		var spyCallback = jasmine.createSpy();
		sitemap_generator.run(null, { 'modified': false, 'finished': true }, spyCallback);

		expect(sitemap_generator.createSitemap).toHaveBeenCalledWith(spyCallback);
	});

});

describe("adding a url", function() {

	 beforeEach(function() {
	 	sitemap_generator.urlRoot = "http://example.com";
		sitemap_generator.urls = [];

		var spyCacheStat = jasmine.createSpy();
		spyCacheStat.andCallFake(function(path, ext, opts, callback) {
			callback(null, {"mtime": new Date(2012, 10, 1) });
		});
		sitemap_generator.cacheStore = { "stat": spyCacheStat };
	 });

	it("add files ending with .html extension", function() {
		var spyCallback = jasmine.createSpy();
		sitemap_generator.addUrl("/path/page.html", spyCallback);

		expect(sitemap_generator.urls).toEqual([ { "loc": "http://example.com/path/page.html", "priority": 0.8, "lastmod": "2012-10-31T18:30:00.000Z", "changefreq": "weekly" } ]);
	});

	it("add files without an extenstion (assuming they are endpoints to pages)", function() {
		var spyCallback = jasmine.createSpy();
		sitemap_generator.addUrl("/path/page", spyCallback);

		expect(sitemap_generator.urls).toEqual([ { "loc": "http://example.com/path/page", "priority": 0.8, "lastmod": "2012-10-31T18:30:00.000Z", "changefreq": "weekly" } ]);
	});

	it("add only the base paths of file names ending with index", function() {
		var spyCallback = jasmine.createSpy();
		sitemap_generator.addUrl("/path/page/index", spyCallback);

		expect(sitemap_generator.urls).toEqual([ { "loc": "http://example.com/path/page", "priority": 0.8, "lastmod": "2012-10-31T18:30:00.000Z", "changefreq": "weekly" } ]);
	});

	it("skip files with other extensions", function() {
		var spyCallback = jasmine.createSpy();
		sitemap_generator.addUrl("/path/styles.css", spyCallback);

		expect(sitemap_generator.urls).toEqual([]);
	});

	it("skip excluded urls", function() {
		sitemap_generator.excludeUrls = [ "http://example.com/path/exclude", "http://example.com/path/old" ];

		var spyCallback = jasmine.createSpy();
		sitemap_generator.addUrl("/path/exclude", spyCallback);

		expect(sitemap_generator.urls).toEqual([]);
	});

});

describe("creating the sitemap", function() {

	it("store the created sitemap in the cache store", function() {
		var spyCacheUpdate = jasmine.createSpy();
		sitemap_generator.cacheStore = { "update": spyCacheUpdate };

		var spyCallback = jasmine.createSpy();
		sitemap_generator.createSitemap(spyCallback);

		expect(spyCacheUpdate).toHaveBeenCalledWith("sitemap", ".xml", jasmine.any(Object), {}, jasmine.any(Function));
	});

	it("call the given callback after storing the sitemap", function() {
		var spyCacheUpdate = jasmine.createSpy();
		spyCacheUpdate.andCallFake(function(filename, ext, cache_obj, opts, callback) {
			callback(null, cache_obj);
		});
		sitemap_generator.cacheStore = { "update": spyCacheUpdate };

		var spyCallback = jasmine.createSpy();
		sitemap_generator.createSitemap(spyCallback);

		expect(spyCallback).toHaveBeenCalled();
	});

});
