import * as whitespace from "is-whitespace-character";
import * as _ from "lodash";

import {
  deriveType,
  END,
  END_OPENING,
  START,
  START_CLOSING,
} from "../narrative-schema/label";

function locator(value, fromIndex) {
  const indexOfStart = value.indexOf(START, fromIndex);
  const indexOfStartClosing = value.indexOf(START_CLOSING, fromIndex);
  if (indexOfStart > -1 && indexOfStartClosing > -1) {
    return Math.min(indexOfStart, indexOfStartClosing);
  }
  return Math.max(indexOfStart, indexOfStartClosing);
}

export default function plugin() {
  function inlineTokenizer(eat, value, silent) {
    if (!value.startsWith(START) && !value.startsWith(START_CLOSING)) {
      return;
    }
    const start = value.substring(0, 2);

    let character = "";
    let previous = "";
    let subvalue = "";
    let index = 1;
    const length = value.length;
    const now = eat.now();
    now.column += 1;
    now.offset += 1;

    while (++index < length) {
      character = value.charAt(index);
      const end = `${previous}${character}`;

      if (end === END || end === END_OPENING) {
        /* istanbul ignore if - never used (yet) */
        if (silent) {
          return true;
        }

        return eat(start + subvalue + end)({
          type: "narrativeSchemaLabel",
          data: {
            hName: "narrativeSchemaLabel",
            info: subvalue,
            labelType: deriveType(start, end),
          },
        });
      }

      subvalue += previous;
      previous = character;
    }
  }
  (inlineTokenizer as any).locator = locator;

  const Parser = this.Parser;

  // Inject inlineTokenizer
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.narrativeSchemaLabel = inlineTokenizer;
  inlineMethods.splice(
    inlineMethods.indexOf("text"),
    0,
    "narrativeSchemaLabel",
  );

  // const Compiler = this.Compiler;

  // // Stringify
  // if (Compiler) {
  //   const visitors = Compiler.prototype.visitors;
  //   visitors.narrativeSchemaLabel = function(node) {
  //     return `!!!${this.data.labelStart}${this.all(node).join("")}${this.data.labelEnd}`;
  //   };
  // }
}
