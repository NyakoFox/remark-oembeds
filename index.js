import { visit } from "unist-util-visit";
import { is } from "unist-util-is";

let whitelist = [
  "soundcloud.com",
  "www.youtube.com",
  "youtu.be",
  "youtube.com",
];
let cachedProviders = [];

async function getProviders() {
  if (cachedProviders.length) {
    return cachedProviders;
  }
  cachedProviders = await (
    await fetch("https://oembed.com/providers.json")
  ).json();
  return cachedProviders;
}

function matchRule(str, rule) {
  var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(
    "^" + rule.split("*").map(escapeRegex).join(".*") + "$"
  ).test(str);
}

export default function remarkOEmbeds() {
  return async (tree) => {
    const providers = await getProviders();
    const paragraphs = [];
    visit(tree, "paragraph", (node) => {
      paragraphs.push(node);
    });

    for (const paragraph of paragraphs) {
      const { children } = paragraph;
      for (const [index, child] of children.entries()) {
        if (is(child, "text")) {
          const { value } = child;
          let url;
          try {
            url = new URL(value);
          } catch (e) {
            continue;
          }

          if (!whitelist.includes(url.hostname)) continue;

          for (const provider of providers) {
            for (const endpoint of provider.endpoints) {
              if (endpoint.schemes) {
                for (const scheme of endpoint.schemes) {
                  if (matchRule(value, scheme)) {
                    const oembed = await (
                      await fetch(
                        `${endpoint.url}?format=json&url=${encodeURIComponent(
                          value
                        )}`
                      )
                    ).json();
                    children[index] = {
                      type: "html",
                      value: oembed.html,
                    };
                  }
                }
              }
            }
          }
        }
      }
    }
  };
}
