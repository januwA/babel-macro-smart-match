const { createMacro } = require("babel-plugin-macros");

function _m(left, right) {
  const isObject = v => Object.prototype.toString.call(v) === "[object Object]";
  if (
    (/^[nsb]/.test(typeof left) && /^[nsb]/.test(typeof right)) ||
    (left === null && right === null)
  ) {
    return left === right;
  } else if (left instanceof RegExp) {
    if (Array.isArray(right)) {
      return right.some(e => left.test(e));
    }
    if (isObject(right)) {
      return Object.keys(right).some(e => left.test(e));
    }
    return left.test(right);
  } else if (right instanceof RegExp) {
    if (Array.isArray(left)) {
      return left.some(e => right.test(e));
    }
    if (isObject(left)) {
      return Object.keys(left).some(e => right.test(e));
    }
    return right.test(left);
  } else if (isObject(left) && isObject(right)) {
    // 匹配哈希的键是否一致
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return (
      (leftKeys.length === 0 && rightKeys.length === 0) ||
      (leftKeys.length === rightKeys.length &&
        leftKeys.some(e => rightKeys.includes(e)))
    );
  } else if (isObject(left) && Array.isArray(right)) {
    // 哈希至少要有一个键在列表中
    const leftKeys = Object.keys(left);
    return leftKeys.some(e => right.includes(e));
  } else if (isObject(right) && Array.isArray(left)) {
    // 哈希至少要有一个键在列表中
    const rightKeys = Object.keys(right);
    return rightKeys.some(e => left.includes(e));
  } else if (isObject(left) && typeof right === "string") {
    return right in left;
  } else if (isObject(right) && typeof left === "string") {
    return left in right;
  } else if (Array.isArray(left)) {
    return left.includes(right);
  } else if (Array.isArray(right)) {
    return right.includes(left);
  }
}

module.exports = createMacro(function myMacro({ references, state, babel }) {
  const { types: t, traverse, parse } = babel;

  traverse(state.file.ast, {
    Program(path) {
      path.unshiftContainer("body", parse(`${_m}`).program.body[0]);
    }
  });

  references.default.forEach(path => {
    const parentPath = path.parentPath;
    if (parentPath.type === "TaggedTemplateExpression") {
      const [left, right] = parentPath.node.quasi.quasis[0].value.raw
        .split("~~")
        .map(e => e.trim());
      const code = `_m(${left}, ${right});`;
      const ast = parse(code);
      parentPath.replaceWith(ast.program.body[0]);
    }
  });
});
