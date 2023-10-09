import fs from "fs";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkOEmbeds from "./index.js";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

const buffer = fs.readFileSync("example.md");

unified()
  .use(remarkParse)
  .use(remarkOEmbeds, {
    whitelist: ["soundcloud.com", "www.youtube.com", "youtu.be", "youtube.com"],
  })
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      "*": [...(defaultSchema.attributes["*"] || []), "style"],
      iframe: [
        ...(defaultSchema.attributes["iframe"] || []),
        ["src", /^https\:\/\/(w\.soundcloud|www\.youtube)\.com/],
        "scrolling",
        "frameborder",
        "allowfullscreen",
      ],
    },
    tagNames: [...defaultSchema.tagNames, "iframe"],
  })
  .use(rehypeStringify)
  .process(buffer, function (err, file) {
    if (err) throw err;
    console.log(file.toString());
  });
