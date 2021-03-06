/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// ReactJS
const PropTypes = require("prop-types");
// Utils
const {
  getGripType,
  isGrip,
  wrapRender,
} = require("./rep-utils");
const { MODE } = require("./constants");

const dom = require("react-dom-factories");
const { span } = dom;

/**
 * Renders Error objects.
 */
ErrorRep.propTypes = {
  object: PropTypes.object.isRequired,
  // @TODO Change this to Object.values once it's supported in Node's version of V8
  mode: PropTypes.oneOf(Object.keys(MODE).map(key => MODE[key])),
};

function ErrorRep(props) {
  let object = props.object;
  let preview = object.preview;

  let name;
  if (preview && preview.name && preview.kind) {
    switch (preview.kind) {
      case "Error":
        name = preview.name;
        break;
      case "DOMException":
        name = preview.kind;
        break;
      default:
        throw new Error("Unknown preview kind for the Error rep.");
    }
  } else {
    name = "Error";
  }

  const content = [];

  if (props.mode === MODE.TINY) {
    content.push(name);
  } else {
    content.push(`${name}: "${preview.message}"`);
  }

  if (preview.stack && props.mode !== MODE.TINY) {
    content.push("\n");

    /**
     * Transform the stack from:
     *
     * semicolon@debugger eval code:1:109
     * jkl@debugger eval code:1:63
     * asdf@debugger eval code:1:28
     * @debugger eval code:1:227
     *
     * Into a column layout:
     *
     * semicolon  (<anonymous>:8:10)
     * jkl        (<anonymous>:5:10)
     * asdf       (<anonymous>:2:10)
     *            (<anonymous>:11:1)
     */

    const stack = [];
    preview.stack
      .split("\n")
      .forEach((line, index) => {
        if (!line) {
          // Skip any blank lines
          return;
        }
        const result = line.match(/^(.*)@(.*)$/);
        let functionName;
        let location;
        if (!result || result.length !== 3) {
          // This line did not match up nicely with the "function@location" pattern for
          // some reason.
          functionName = line;
        } else {
          functionName = result[1];
          location = ` (${result[2]})`;
        }
        stack.push(
          span(
            { key: "fn" + index, className: "objectBox-stackTrace-fn" },
            functionName
        ));
        stack.push(
          span(
            { key: "location" + index, className: "objectBox-stackTrace-location" },
            location
        ));
      });

    content.push(
      span(
        { key: "stack", className: "objectBox-stackTrace-grid" },
        stack
      )
    );
  }

  return span({
    "data-link-actor-id": object.actor,
    className: "objectBox-stackTrace"
  }, content);
}

// Registration
function supportsObject(object, noGrip = false) {
  if (noGrip === true || !isGrip(object)) {
    return false;
  }
  return (
    object.preview &&
    getGripType(object, noGrip) === "Error" ||
    object.class === "DOMException"
  );
}

// Exports from this module
module.exports = {
  rep: wrapRender(ErrorRep),
  supportsObject,
};
