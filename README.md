# punch-sitemap-generator

Plugin to create the sitemap.xml for your [Punch](http://laktek.github.com/punch) site.

## How to Use 

* Install the package

	`npm install punch-sitemap-generator`

* Open your Punch project's configurations (`config.json`) and add the following:

		"plugins": {

			"generator_hooks": {
				"sitemap_generator": "punch-sitemap-generator"
			}

		}

* Settings for the sitemap generator plugin must be specified under `sitemap_generator` in the `config.json`. 

		"sitemap_generator": {
			"url_root": "http://example.com"	
		}

You can set the following options for the `sitemap_generator`:
	- `url_root` (**required**) - Root URL (host and protocol) of your published site.
	- `changefreq` - Change frequency for all pages in the site (default `weekly`)
	- `exclude_urls` - An array of full URLs to exclude from the sitemap (eg. `http://example.com/private/page.html`).
	- `manual_entries` - List of manual URL entries to include in the sitemap. (eg. `[ { "loc": "http://example.com/custom", "priority": "0.6", "lastmod": "2012-01-01", "changefreq": "yearly" } ]`)

* `sitemap.xml` will be generated along with the rest of the files in your site when you run the command `punch generate` (`punch g`). It will be stored in the `output` directory, ready to be published.

## License

Copyright (c) 2012 Lakshan Perera  
Licensed under the MIT license.
