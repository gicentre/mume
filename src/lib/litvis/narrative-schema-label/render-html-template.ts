import * as cheerio from "cheerio";
import * as Handlebars from "handlebars";
import { Attributes } from "../../attributes";
import { LabelType } from "../narrative-schema";

const FAKE_CHILDREN_CONTENTS = "__FAKE_CHILDREN__";

export default (
  htmlTemplate,
  labelName: string,
  labelType: LabelType,
  labelAttributes: Attributes,
) => {
  const rawRenderedTemplate = Handlebars.compile(htmlTemplate)({
    ...labelAttributes,
    children: FAKE_CHILDREN_CONTENTS,
  });
  const $ = cheerio.load(rawRenderedTemplate);
  $("*").attr("data-role", "narrativeSchemaLabelChild");
  $(":root")
    .attr("data-role", "narrativeSchemaLabel")
    .attr("data-narrativeSchemaLabelName", labelName)
    .attr(
      "data-narrativeSchemaLabelAttributes",
      JSON.stringify(labelAttributes),
    );
  const $html = $(rawRenderedTemplate);
  const rawHtml = $.html();

  const positionOfFakeChildren = rawHtml.indexOf(FAKE_CHILDREN_CONTENTS);
  let html;
  if (labelType === LabelType.SINGLE) {
    if (positionOfFakeChildren !== -1) {
      throw new Error("Single label cannot have children");
    }
    html = rawHtml;
  } else {
    if (positionOfFakeChildren === -1) {
      throw new Error("Paired label must have children");
    }
    if (labelType === LabelType.PAIRED_OPENING) {
      html = rawHtml.substr(0, positionOfFakeChildren);
    } else {
      html = rawHtml.substr(
        positionOfFakeChildren + FAKE_CHILDREN_CONTENTS.length,
      );
    }
  }
  return html;
};
