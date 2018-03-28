import * as _ from "lodash";
import * as visit from "unist-util-visit";
import { LitvisDocument } from ".";
import { parseBlockInfo } from "../../block-info/index";
import {
  AttributeDerivatives,
  BlockOutputFormat,
  extractAttributeDerivatives,
  resolveExpressions,
} from "../attribute-derivatives";

function visitCodeBlock(ast, vFile) {
  return visit(ast, "code", (codeBlockNode, index, parent) => {
    if (!codeBlockNode.data || !codeBlockNode.data.litvisAttributeDerivatives) {
      return;
    }

    // do not re-visit the same code block twice
    if (codeBlockNode.data.visitedByExtractOutputItems) {
      return;
    }
    codeBlockNode.data.visitedByExtractOutputItems = true;

    const nodesBefore = [];
    const nodesAfter = [];
    let nodes = nodesBefore;
    const derivatives = resolveExpressions(
      codeBlockNode.data.litvisAttributeDerivatives,
      codeBlockNode.value,
    );

    derivatives.outputFormats.forEach((outputFormat) => {
      switch (outputFormat) {
        case BlockOutputFormat.L:
          nodes = nodesAfter;
          break;
        default:
          const expressions =
            derivatives.outputExpressionsByFormat[outputFormat];
          nodes.push(
            ...expressions.map((expression) => ({
              type: "outputExpression",
              position: codeBlockNode.position,
              data: {
                text: expression,
                outputFormat,
                contextName: derivatives.contextName,
              },
            })),
          );
      }
    });
    const resultingNodes = [];
    if (nodesBefore.length) {
      resultingNodes.push({
        type: "outputExpressionGroup",
        children: nodesBefore,
      });
    }
    resultingNodes.push(codeBlockNode);
    if (nodesAfter.length) {
      resultingNodes.push({
        type: "outputExpressionGroup",
        children: nodesAfter,
      });
    }
    parent.children.splice(index, 1, ...resultingNodes);
  });
}

function visitTripleHatReference(ast, vFile: LitvisDocument) {
  return visit(ast, "tripleHatReference", (tripleHatReferenceNode) => {
    if (
      !tripleHatReferenceNode.data ||
      !tripleHatReferenceNode.data.litvisAttributeDerivatives
    ) {
      return;
    }
    const nodes = [];
    const derivatives: AttributeDerivatives =
      tripleHatReferenceNode.data.litvisAttributeDerivatives;
    derivatives.outputFormats.forEach((outputFormat) => {
      switch (outputFormat) {
        case BlockOutputFormat.L:
          vFile.message(
            "Use of l is not allowed in triple hat references.",
            tripleHatReferenceNode,
            "litvis:triple-hat-reference-use",
          );
          break;
        default:
          const expressions =
            derivatives.outputExpressionsByFormat[outputFormat];
          if (_.isArray(expressions)) {
            nodes.push(
              ...expressions.map((expression) => ({
                type: "outputExpression",
                position: tripleHatReferenceNode.position,
                data: {
                  text: expression,
                  outputFormat,
                  contextName: derivatives.contextName,
                },
              })),
            );
          } else {
            vFile.message(
              `${outputFormat} should be followed by a list of expressions in triple hat references.`,
              tripleHatReferenceNode,
              "litvis:triple-hat-reference-use",
            );
          }
      }
      tripleHatReferenceNode.children = nodes;
    });
  });
}

export default function() {
  return function transformer(ast, vFile, next) {
    visitCodeBlock(ast, vFile);
    visitTripleHatReference(ast, vFile);

    if (typeof next === "function") {
      return next(null, ast, vFile);
    }

    return ast;
  };
}
