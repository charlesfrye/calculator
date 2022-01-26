const MAXWIDTH = 16;

// the calculator never has more than one binary op in flight
// at any given time,
// so we structure the program around a finite automaton, with four STATEs:
//  - AWAITing numbers or an operator while displaying the LEFT-hand-side
//  - ENTERing numbers to edit the LEFT-hand-side of the expression
//  - AWAITing numbers or an operator while displaying the RIGHT-hand-side
//  - ENTERing numbers to the the RIGHT-hand-side of the expression
// key presses can cause a change to that STATE and/or to the values of the
// LHS and RHS of the expression and the OPerator between them.
let STATE = "AWAIT-LEFT"; // what state is the calculator in?
let LHS = "0"; // what's the left-hand-side of the current expression?
let OP = ""; // what's the operator in the current expression?
let RHS = ""; // what the right-hand-side of the current expression?

const evaluate = function() {
  const result = operate(OP, LHS, RHS);
  LHS = result;
  OP = "";
  RHS = "";
  STATE = "AWAIT-LEFT";
  return result;
};

const reset = function() {
  STATE = "AWAIT-LEFT";
  LHS = "0";
  OP = "";
  RHS = "";
};

const runKeypress = function(key) {
  const keyClass = getKeyClass(key);
  if (keyClass === "clear") {
    reset();
  } else {
    switch (STATE) {
      case "AWAIT-LEFT":
        runKeypressAwaitLeft(key, keyClass);
        break;
      case "ENTER-LEFT":
        runKeypressEnterLeft(key, keyClass);
        break;
      case "ENTER-RIGHT":
        runKeypressEnterRight(key, keyClass);
        break;
      case "AWAIT-RIGHT":
        runKeypressAwaitRight(key, keyClass);
        break;
      default:
        throw new Error(`bad state ${STATE}`);
    };
  };
  updateDisplay();
};

const updateDisplay = function() {
  console.log(`${STATE}: (${LHS} ${OP} ${RHS})`)
  let displayContent;
  switch (STATE) {
    case "AWAIT-LEFT":
    case "ENTER-LEFT":
    case "AWAIT-RIGHT":
      displayContent = LHS;
      break;
    case "ENTER-RIGHT":
      displayContent = RHS;
      break;
    default:
      throw new Error(`bad state ${STATE}`);
  }

  DISPLAY.innerText = displayContent;
  console.log(displayContent)
};

const getKeyClass = function(key) {
  if (key === "clear") {
    return "clear";
  };
  if (EDITS.includes(key)) {
    return "edit";
  };
  if (OPS.includes(key)) {
    return "op";
  };
  if (EVALS.includes(key)) {
    return "eval";
  };
  throw new Error(`class of key ${key} not understood`);
};

const runKeypressAwaitLeft = function(key, keyClass) {
  switch (keyClass) {
    case "edit":
      STATE = "ENTER-LEFT";
      LHS = updateString("", key);
      break;
    case "eval":
      break;
    case "op":
      OP = opFrom(key);
      STATE = "AWAIT-RIGHT";
      break;
    default:
      throw new Error(`bad keyclass ${keyClass} in ${STATE}`);
  };
};

const runKeypressAwaitRight = function(key, keyClass) {
  switch (keyClass) {
    case "edit":
      STATE = "ENTER-RIGHT";
      RHS = updateString("", key);
      break;
    case "eval":
      break;
    case "op":
      OP = opFrom(key);
      RHS = LHS;
      evaluate();
      break;
    default:
      throw new Error(`bad keyclass ${keyClass} in ${STATE}`);
  };
};

const runKeypressEnterLeft = function(key, keyClass) {
  switch (keyClass) {
    case "edit":
      LHS = updateString(LHS, key);
      break;
    case "eval":
      break;
    case "op":
      OP = opFrom(key);
      STATE = "AWAIT-RIGHT";
      break;
    default:
      throw new Error(`bad keyclass ${keyClass} in ${STATE}`);
  };
};

const runKeypressEnterRight = function(key, keyClass) {
  switch (keyClass) {
    case "edit":
      RHS = updateString(RHS, key);
      break;
    case "eval":
      evaluate();
      STATE = "AWAIT-LEFT";
      break;
    case "op":
      evaluate();
      OP = opFrom(key);
      STATE = "AWAIT-RIGHT";
      break;
    default:
      throw new Error(`bad keyclass ${keyClass} in ${STATE}`);
  };
};

const opFrom = function(str) {
  if (str.length > 1) {
    throw new Error(`bad op string ${str}`);
  } else if (!OPS.includes(str)) {
    throw new Error(`bad op string ${str}`);
  };
  return str;
};

const add = function(lhs, rhs) {
  return +lhs + +rhs;
};

const subtract = function(lhs, rhs) {
  return +lhs - +rhs;
};

const multiply = function(lhs, rhs) {
  return +lhs * +rhs;
};

const divide = function(lhs, rhs) {
  return +lhs / +rhs;
};

const updateString = function(current, k) {
  let out;

  if (current === "NaN") {
    return "NaN";
  };

  if (k === "±") {
    if (current.includes("-")) {
      if (!current[0] === "-") {
        throw new Error(`bad plus-minus in ${current}`)
      };
      out = current.substring(1)
    } else {
      out = "-" + current;
    };
  }

  if (k === ".") {
    if (current.includes(".")) {
      out = current;
    } else {
      out = current + ".";
    };
  };

  if (DIGITS.includes(k)) {
    out = current + k;
  };

  if (out.length > MAXWIDTH) {
    return current;
  } else {
    return out;
  };
};

const toString = function(num) {
  let out = num.toString();
  if (out.includes("Infinity")) {
    out = "NaN";
  };
  if (out.length >= MAXWIDTH) {
    out = handleOverflow(out)
  };
  return out;
};

const handleOverflow = function(stringNum) {
  if (stringNum.includes(".")) {
    return stringNum.substring(0, MAXWIDTH);
  } else {
    return "NaN";
  };
};

const operate = function(op, lhs, rhs) {
  switch (op) {
    case "+":
      return toString(add(lhs, rhs));
    case "-":
      return toString(subtract(lhs, rhs));
    case "*":
      return toString(multiply(lhs, rhs));
    case "/":
      return toString(divide(lhs, rhs));
    default:
      throw new Error(`did not understand op ${op}`);
  };
};

const DISPLAY = document.querySelector(".display");
const buttons = document.querySelectorAll(".button");

const digitButtons = Array.from(document.querySelectorAll(".button.digit"));
const editButtons = Array.from(document.querySelectorAll(".button.edit"));
const opButtons = Array.from(document.querySelectorAll(".button.op"));
const evalButtons = Array.from(document.querySelectorAll(".button.eval"));

const getID = element => element.id;
const concat = (strA, strB) => strA + strB;

const DIGITS = digitButtons.map(getID).reduce(concat);
const EDITS = editButtons.map(getID).reduce(concat);
const OPS = opButtons.map(getID).reduce(concat);
const EVALS = evalButtons.map(getID).reduce(concat);

const fillButton = function(button) {
  if (button.innerText === "") {
    button.innerText = button.id;
  };
};

const attachKeyPress = function(button) {
  button.addEventListener("click", (e) => runKeypress(e.target.id) );
};

buttons.forEach(button => fillButton(button));

buttons.forEach(button => attachKeyPress(button));

runKeypress("=");
