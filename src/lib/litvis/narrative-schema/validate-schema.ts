import * as jsonschema from "jsonschema";

const v = new jsonschema.Validator();

export default (json) => v.validate(json, schema);

const schema = {
  title: "NarrativeSchema",
  type: "object",
  definitions: {
    labelKind: {
      type: "object",
      properties: {
        htmlTemplate: { type: "string" },
      },
      required: ["htmlTemplate"],
      additionalProperties: false,
    },
    selector: {
      type: "object",
      properties: {
        label: { type: "string" },
        kind: { type: "string", enum: ["single", "paired"] },
        trimmedContent: {
          type: "string",
          pattern: "^([^\\s].*[^\\s]|[^\\s])$",
        },
      },
      minProperties: 1,
      additionalProperties: false,
    },
  },
  properties: {
    dependencies: {
      type: "array",
      uniqueItems: true,
      items: { type: "string" },
    },
    labels: {
      description:
        "a list of new labels to introduce; names must not be the same as in other schemas being used",
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            description:
              "identifier you expect to see inside {( ... )}, e.g. my_label ",
            type: "string",
            pattern: "^[a-z][a-zA-Z_0-9]+$",
          },
          single: { $ref: "#/definitions/labelKind" },
          paired: { $ref: "#/definitions/labelKind" },
        },

        anyOf: [
          {
            title: "single label",
            required: ["single"],
          },
          {
            title: "paired label",
            required: ["paired"],
          },
        ],
        additionalProperties: false,
      },
    },
    rules: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: {
            description:
              "text to show in the linter if the rule is not followed",
            type: "string",
          },
          selector: { $ref: "#/definitions/selector" },
          minimumOccurrences: {
            type: "number",
            minimum: 0,
            multipleOf: 1,
          },
          maximumOccurrences: {
            type: "number",
            minimum: 0,
            multipleOf: 1,
          },
        },
        required: ["description", "selector"],
        additionalProperties: false,
      },
    },
    styling: {
      type: "object",
      properties: {
        css: {
          description: "CSS to inject into documents that form the narrative",
          type: "string",
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};
