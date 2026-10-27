import test from "ava";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const SCRIPT_PATH = "packages/create-proxy-app/templates/default/public/index.js";
const HTML_PATH = "packages/create-proxy-app/templates/default/public/index.html";

function loadTemplate({ navigationError, storage = new Map() } = {}) {
	const listeners = new Map();
	const elements = new Map(
		["sj-form", "sj-address", "sj-search-engine", "sj-frame-wrapper", "sj-frame", "sj-frame-url", "sj-error", "sj-error-code"].map(
			(id) => [
				id,
				{
					style: {},
					textContent: "",
					value:
						id === "sj-search-engine"
							? "https://www.google.com/search?q=%s"
							: "",
					addEventListener(type, handler) {
						listeners.set(`${id}:${type}`, handler);
					},
				},
			]
		)
	);
	const destinations = [];
	const frame = {
		go: async (url) => {
			destinations.push(url);
			if (navigationError) throw navigationError;
		},
	};
	const context = {
		URL,
		encodeURIComponent,
		location: { href: "https://proxy.example/" },
		history: { replaceState() {} },
		localStorage: {
			getItem: (key) => storage.get(key) ?? null,
			setItem: (key, value) => storage.set(key, value),
		},
		document: { getElementById: (id) => elements.get(id) },
		initBootstrap: async () => ({ createFrame: () => frame }),
		$scramjetUtils: {
			HttpCachePlugin: class {},
			UrlWatcherPlugin: class {},
			CatchEscapedLinksPlugin: class {},
		},
	};

	vm.runInNewContext(readFileSync(SCRIPT_PATH, "utf8"), context);
	return { elements, listeners, destinations, storage };
}

async function submit(template, value) {
	template.elements.get("sj-address").value = value;
	const event = { preventDefault() {} };
	await template.listeners.get("sj-form:submit")(event);
}

test("proxy template searches plain text with an encoded Google URL", async (t) => {
	const template = loadTemplate();
	template.elements.get("sj-search-engine").value =
		"https://www.google.com/search?q=%s";

	await submit(template, "cats & dogs");

	t.deepEqual(template.destinations, [
		"https://www.google.com/search?q=cats%20%26%20dogs",
	]);
});

test("proxy template navigates a domain directly", async (t) => {
	const template = loadTemplate();

	await submit(template, "example.com/path");

	t.deepEqual(template.destinations, ["https://example.com/path"]);
});

test("proxy template supports and saves DuckDuckGo as a search engine", async (t) => {
	const template = loadTemplate();
	template.elements.get("sj-search-engine").value =
		"https://duckduckgo.com/?q=%s";
	template.listeners.get("sj-search-engine:change")();

	await submit(template, "cats & dogs");

	t.deepEqual(template.destinations, [
		"https://duckduckgo.com/?q=cats%20%26%20dogs",
	]);
	t.is(
		template.storage.get("sj-search-engine"),
		"https://duckduckgo.com/?q=%s"
	);
});

test("proxy template displays a navigation error instead of hiding it", async (t) => {
	const template = loadTemplate({ navigationError: new Error("connection failed") });

	await submit(template, "example.com");

	t.is(template.elements.get("sj-error").textContent, "connection failed");
	t.is(template.elements.get("sj-frame-wrapper").style.display, "none");
});

test("proxy template offers Google and DuckDuckGo search endpoints", (t) => {
	const html = readFileSync(HTML_PATH, "utf8");

	t.regex(html, /value="https:\/\/www\.google\.com\/search\?q=%s"/);
	t.regex(html, /value="https:\/\/duckduckgo\.com\/\?q=%s"/);
});
