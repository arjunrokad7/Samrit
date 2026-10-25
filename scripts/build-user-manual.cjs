// Print the repository's Markdown manual without additional runtime dependencies.
// Supported source blocks: headings, paragraphs, flat lists and pipe tables.
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require("../frontend/node_modules/playwright");
const root = path.resolve(__dirname, "..");
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
function inline(text) {
  const code = [];
  text = text.replace(/`([^`]+)`/g, (_, value) => {
    code.push("<code>" + escape(value) + "</code>");
    return "\u0000" + (code.length - 1) + "\u0000";
  });
  return escape(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
      const decoded = url.replace(/&amp;/g, "&");
      if (!/^(https?:\/\/|#|[A-Za-z0-9_.-]+(?:\/|$))/.test(decoded))
        throw Error("Unsupported manual link");
      return '<a href="' + escape(decoded) + '">' + label + "</a>";
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\u0000(\d+)\u0000/g, (_, index) => code[Number(index)]);
}
function blocks(lines) {
  const result = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    const heading = /^(#{2,3}) (.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      result.push(
        `<h${level} id="${slug(heading[2])}">${inline(heading[2])}</h${level}>`,
      );
      i++;
      continue;
    }
    if (line.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|"))
        rows.push(
          lines[i++]
            .trim()
            .slice(1, -1)
            .split("|")
            .map((s) => s.trim()),
        );
      assert.ok(
        rows.length >= 2 && rows[1].every((c) => /^:?-+:?$/.test(c)),
        "Invalid table separator",
      );
      result.push(
        "<table><thead><tr>" +
          rows[0].map((c) => "<th>" + inline(c) + "</th>").join("") +
          "</tr></thead><tbody>" +
          rows
            .slice(2)
            .map(
              (r) =>
                "<tr>" +
                r.map((c) => "<td>" + inline(c) + "</td>").join("") +
                "</tr>",
            )
            .join("") +
          "</tbody></table>",
      );
      continue;
    }
    if (/^(- |\d+\. )/.test(line)) {
      const ordered = /^\d+\./.test(line),
        tag = ordered ? "ol" : "ul",
        items = [];
      while (
        i < lines.length &&
        (ordered ? /^\d+\. / : /^- /).test(lines[i].trim())
      )
        items.push(lines[i++].trim().replace(/^(- |\d+\. )/, ""));
      result.push(
        "<" +
          tag +
          ">" +
          items.map((item) => "<li>" + inline(item) + "</li>").join("") +
          "</" +
          tag +
          ">",
      );
      continue;
    }
    const paragraph = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{2,3} |\||- |\d+\. )/.test(lines[i].trim())
    )
      paragraph.push(lines[i++].trim());
    if (!paragraph.length) throw Error("Unsupported manual block: " + line);
    result.push("<p>" + inline(paragraph.join(" ")) + "</p>");
  }
  return result;
}
async function main() {
  const source = await fs.readFile(
    path.join(root, "docs/USER_MANUAL.md"),
    "utf8",
  );
  const chapters = [];
  for (const line of source.split(/\r?\n/)) {
    const match = /^## (\d+\. .+)$/.exec(line);
    if (match)
      chapters.push({ title: match[1], id: slug(match[1]), lines: [line] });
    else if (chapters.length) chapters.at(-1).lines.push(line);
  }
  assert.equal(chapters.length, 9, "Expected nine major manual sections");
  for (const chapter of chapters) chapter.blocks = blocks(chapter.lines);
  const font = async (name, weight) =>
    `@font-face{font-family:${name};font-weight:${weight};src:url(data:font/woff2;base64,${(await fs.readFile(path.join(root, `frontend/node_modules/@fontsource/${name === "ManualBody" ? "dm-sans" : "lilita-one"}/files/${name === "ManualBody" ? "dm-sans" : "lilita-one"}-latin-${weight}-normal.woff2`))).toString("base64")}) format('woff2')}`;
  const fontLicenses = {};
  for (const name of ['dm-sans', 'lilita-one']) {
    fontLicenses[name] = await fs.readFile(path.join(root, 'frontend/node_modules/@fontsource', name, 'LICENSE'), 'utf8');
  }
  const licenseJSON = JSON.stringify(fontLicenses).replace(/</g, '\\u003c');
  const logo = (
    await fs.readFile(path.join(root, "frontend/public/brand/samrit-dark.png"))
  ).toString("base64");
  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "America/New_York",
  }).format(new Date());
  const css = `${await font("ManualBody", 400)}${await font("ManualBody", 600)}${await font("ManualDisplay", 400)}
    *{box-sizing:border-box}html{background:#e8eef0}body{margin:0;color:#244557;font:10.5pt/1.5 ManualBody,Arial,sans-serif}
    .page{position:relative;width:210mm;height:297mm;padding:22mm 18mm 20mm;margin:8mm auto;background:white;box-shadow:0 2px 15px #24455726;break-after:page;page-break-after:always;overflow:hidden}
    .page:last-child{break-after:auto;page-break-after:auto}.page-content{height:253mm;display:flow-root}
    header{position:absolute;top:10mm;left:18mm;right:18mm;border-bottom:1px solid #d5dfe1;padding-bottom:3mm;font-size:8pt;color:#62747e;display:flex;justify-content:space-between}
    footer{position:absolute;bottom:9mm;left:18mm;right:18mm;border-top:1px solid #d5dfe1;padding-top:3mm;font-size:8pt;color:#62747e;display:flex;justify-content:space-between}
    h1{font:42pt/1.1 ManualDisplay,sans-serif;margin:12mm 0 6mm}h2{font-size:22pt;line-height:1.2;margin:0 0 7mm;break-after:avoid}h3{font-size:12.5pt;line-height:1.3;margin:6mm 0 3mm;break-after:avoid}p{margin:0 0 3.5mm}ul,ol{margin:0 0 4mm;padding-left:6mm}li{margin-bottom:1.5mm}strong{font-weight:600}a{color:#376c6f;text-decoration:underline;text-underline-offset:2px}code{font:8.8pt/1.4 Consolas,monospace;background:#eef3f3;padding:0 2px;overflow-wrap:anywhere}
    table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9pt;line-height:1.4;margin:4mm 0 5mm;break-inside:avoid;page-break-inside:avoid}thead{display:table-header-group}tr,th,td{break-inside:avoid;page-break-inside:avoid}th,td{border:1px solid #cedadd;padding:2.2mm 2.5mm;vertical-align:top;overflow-wrap:anywhere}th{background:#eaf1ed;font-weight:600;text-align:left}tbody tr:nth-child(even){background:#f7f9fa}table.compact{font-size:8.5pt}table.compact th,table.compact td{padding:1.7mm 2mm}
    .cover .page-content{display:flex;flex-direction:column;justify-content:center}.cover img{width:70mm;height:40mm;object-fit:contain;object-position:left}.cover .eyebrow{margin-top:10mm;color:#537a5a;font-size:10pt;letter-spacing:2px;text-transform:uppercase}.cover .subtitle{font-size:17pt;max-width:145mm;margin-bottom:15mm}.cover .details{border-top:2px solid #537a5a;padding-top:6mm;line-height:1.9}.cover .audience{margin-top:12mm;color:#62747e}
    .toc-row{display:flex;align-items:baseline;gap:3mm;padding:4mm 0;border-bottom:1px solid #dde5e7;text-decoration:none;color:#244557}.toc-row span:first-child{flex:1}.toc-row .number{font-weight:600;color:#376c6f}.toc-note{margin-top:10mm;color:#62747e}
    @page{size:A4;margin:0}@media print{html,body{background:white}.page{margin:0;box-shadow:none}}`;
  const initial = `<!doctype html><html lang="en-US"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Samrit - Platform User Manual</title><script type="application/json" id="embedded-font-licenses">${licenseJSON}</script><style>${css}</style></head><body>
    <section class="page cover"><div class="page-content"><img alt="Samrit" src="data:image/png;base64,${logo}"><p class="eyebrow">Final submission edition</p><h1>Platform<br>User Manual</h1><p class="subtitle">Food access and accountable<br>surplus-food recovery</p><div class="details"><strong>Operating region:</strong> New York City, United States<br><strong>Time zone:</strong> America/New_York<br><strong>Prepared:</strong> ${escape(date)}</div><p class="audience">For people finding food, donors, distribution centers,<br>NGO drivers and central administrators.</p></div></section>
    <section class="page toc"><header><span>SAMRIT</span><span>Platform User Manual</span></header><div class="page-content"><h2>Table of contents</h2><nav aria-label="Table of contents" id="contents"></nav><p class="toc-note">Each numbered section starts on a new page. Tables remain on one page; headings stay with the text that follows.</p></div></section></body></html>`;
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROME_PATH
        ? { executablePath: process.env.CHROME_PATH }
        : process.env.CI
          ? {}
          : { channel: "chrome" }),
    });
    const page = await browser.newPage();
    await page.setContent(initial);
    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => document.fonts.ready);
    const result = await page.evaluate((chapters) => {
      const chapterPages = [];
      function newPage() {
        const section = document.createElement("section");
        section.className = "page chapter";
        section.innerHTML =
          '<header><span>SAMRIT</span><span>Platform User Manual</span></header><div class="page-content"></div>';
        document.body.append(section);
        return section.querySelector(".page-content");
      }
      function fits(container) {
        return container.scrollHeight <= container.clientHeight + 1;
      }
      for (const chapter of chapters) {
        let content = newPage();
        chapterPages.push({
          title: chapter.title,
          id: chapter.id,
          page: document.querySelectorAll(".page").length,
        });
        for (let i = 0; i < chapter.blocks.length; i++) {
          const template = document.createElement("template");
          template.innerHTML = chapter.blocks[i];
          const block = template.content.firstElementChild;
          const heading = /^H[23]$/.test(block.tagName);
          content.append(block);
          let probe;
          if (heading && chapter.blocks[i + 1]) {
            const t = document.createElement("template");
            t.innerHTML = chapter.blocks[i + 1];
            probe = t.content.firstElementChild;
            content.append(probe);
          }
          const fit = fits(content);
          if (probe) probe.remove();
          if (!fit) {
            block.remove();
            if (content.children.length) content = newPage();
            content.append(block);
          }
          if (!fits(content) && block.tagName === "TABLE")
            block.classList.add("compact");
          if (!fits(content))
            throw Error(
              "Content block cannot fit intact on A4: " +
                chapter.title +
                " / " +
                block.tagName,
            );
        }
      }
      document.querySelector("#contents").innerHTML = chapterPages
        .map(
          (c) =>
            '<a class="toc-row" href="#' +
            c.id +
            '"><span>' +
            c.title +
            '</span><span class="number">' +
            c.page +
            "</span></a>",
        )
        .join("");
      const pages = [...document.querySelectorAll(".page")];
      for (const [index, section] of pages.entries()) {
        if (index === 0) continue;
        const footer = document.createElement("footer");
        footer.innerHTML =
          "<span>Samrit · User Manual</span><span>Page " +
          (index + 1) +
          " of " +
          pages.length +
          "</span>";
        section.append(footer);
      }
      const tables = [...document.querySelectorAll("table")].map(
        (table, index) => {
          const p = table.closest(".page"),
            c = p.querySelector(".page-content"),
            a = table.getBoundingClientRect(),
            b = c.getBoundingClientRect();
          if (a.top < b.top - 1 || a.bottom > b.bottom + 1)
            throw Error(
              "Table " + (index + 1) + " crosses page content boundary",
            );
          return {
            table: index + 1,
            page: pages.indexOf(p) + 1,
            rows: table.rows.length,
          };
        },
      );
      for (const section of pages)
        if (!fits(section.querySelector(".page-content")))
          throw Error("Page content overflow");
      return { pages: pages.length, chapters: chapterPages, tables };
    }, chapters);
    const html =
      "<!doctype html>\n" +
      (await page.locator("html").evaluate((el) => el.outerHTML));
    await fs.writeFile(path.join(root, "docs/USER_MANUAL.html"), html);
    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      tagged: true,
      outline: true,
    });
    await fs.writeFile(path.join(root, "docs/USER_MANUAL.pdf"), pdf);
    const pdfPages = (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || [])
      .length;
    assert.equal(
      pdfPages,
      result.pages,
      "PDF page count must match the paginated HTML",
    );
    await fs.mkdir(path.join(root, ".screenshots"), { recursive: true });
    await page
      .locator(".cover")
      .screenshot({
        path: path.join(root, ".screenshots/manual-title-page.png"),
      });
    await page
      .locator(".toc")
      .screenshot({
        path: path.join(root, ".screenshots/manual-contents.png"),
      });
    const tablePage = result.tables.at(-1).page;
    await page
      .locator(".page")
      .nth(tablePage - 1)
      .screenshot({
        path: path.join(root, ".screenshots/manual-table-page.png"),
      });
    console.log(
      `Built USER_MANUAL.pdf and USER_MANUAL.html: ${result.pages} A4 pages, ${chapters.length} chapters, ${result.tables.length} intact tables.`,
    );
    console.log(
      "Chapter start pages: " +
        result.chapters
          .map((c) => c.title.split(".")[0] + ": " + c.page)
          .join(", "),
    );
  } finally {
    if (browser) await browser.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
