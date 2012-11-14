/*
 * punch-sitemap-generator
 * https://github.com/laktek/punch-sitemap-generator
 *
 * Copyright (c) 2012 Lakshan Perera
 * Licensed under the MIT license.
 */

var path = require("path");
var url = require("url");
var module_utils = require("punch").Utils.Module;
var path_utils = require("punch").Utils.Path;
var object_utils = require("punch").Utils.Obj;

module.exports = {

	urls: [],

	urlRoot: "",

	changeFreq: "weekly",

	excludeUrls: [],

	cacheStore: null,

	setup: function(config) {
		var self = this;
		var sitemap_config = config.sitemap_generator || {};
		self.urlRoot = sitemap_config.url_root;
		self.changeFreq = sitemap_config.changefreq || self.changeFreq;
		self.cacheStore = module_utils.requireAndSetup(config.plugins.cache_store, config);
		self.excludeUrls = sitemap_config.exclude_urls || [];

		// manually include urls
		self.urls = sitemap_config.manual_entries || [];
	},

	createSitemap: function(callback) {
		var self = this;
		var urlset_xml = [];

		for (var i = 0; i < self.urls.length; i++) {
			urlset_xml.push( "<url>" +
											 "<loc>" + self.urls[i].loc + "</loc>" +
											 "<lastmod>" + self.urls[i].lastmod + "</lastmod>" +
											 "<changefreq>" + self.urls[i].changefreq + "</changefreq>" +
											 "<priority>" + self.urls[i].priority + "</priority>" +
											 "</url>" );
		}

		var output = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
								 "<!-- generator=\"punch-sitemap-generator\" -->" +
								 "<!-- sitemap-generator-url=\"http://www.github.com/laktek/punch-sitemap-generator\" sitemap-generator-version=\"0.0.1\" -->" +
								 "<!-- generated-on=\"" + new Date().toISOString() + "\" -->" +
								 "<urlset xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd\" xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">" +

								 urlset_xml.join("") +

								"</urlset>";

		return self.cacheStore.update("sitemap", ".xml", object_utils.cacheObj(output, {}), {}, function(err, cache_obj) {
			if (err) {
				console.log(err);
			}

			console.log( "Created /sitemap.xml");

			return callback();
		});

	},

	addUrl: function(file_path, callback) {
		var self = this;
		var extname = path.extname(file_path);
		var url_obj = {};

		if (extname === ".html" || extname === "") {
			var file_portions = file_path.replace(/^\//, '').split("/");
			var last_portion = file_portions[file_portions.length - 1];

			if (last_portion === "index") {
				file_portions.pop();
			}

			var priority = 1 - ( 0.1 * file_portions.length );
			var loc = url.resolve(self.urlRoot, file_portions.join("/"));
			var lastmod = new Date(); // set current date as the default lastmod
			var changefreq = self.changeFreq;

			// check whether to exclude the url
			if ( self.excludeUrls.indexOf(loc) > -1 ) {
				return callback();
			}

			// get the last modified
			var cache_ext = (extname || ".html");
			var cache_path = path_utils.getBasename(file_path, cache_ext);
			self.cacheStore.stat(cache_path, cache_ext, {}, function(err, stat) {
				if (!err) {
					lastmod = stat.mtime;
				}
				self.urls.push({ "loc": loc, "priority": priority, "lastmod": lastmod.toISOString(), "changefreq": changefreq });
				return callback();
			});
		} else {
			// not a page
			return callback();
		}
	},

	run: function(file_path, options, callback) {
		var self = this;
		var finished = options.finished || false;

		if (finished) {
			return self.createSitemap(callback);
		}

		if (file_path) {
			// add url to the list of urls
			return self.addUrl(file_path, callback);
		}

		return callback();
	},

};
