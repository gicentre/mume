import { unescapeString } from "../utility";

export default (html) =>
  html
    .replace(
      /<p>(<litvis-narrative-schema-label>.*<\/litvis-narrative-schema-label>)<\/p>/g,
      "$1",
    )
    .replace(
      /<litvis-narrative-schema-label>(.*)<\/litvis-narrative-schema-label>/g,
      (_, inner) => unescapeString(inner),
    );
