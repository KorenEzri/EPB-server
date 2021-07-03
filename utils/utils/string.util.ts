export const toLineArray = (string: string, parseFunc?: any) => {
  if (parseFunc) return parseFunc(string.split("\n"));
  return string.split("\n");
};
export const splitNameType = (toSplit: string | string[]) => {
  if (Array.isArray(toSplit)) {
    return toSplit.map((string: string) => {
      const splatString = string.split(":");
      return { name: splatString[0].trim(), type: splatString[1].trim() };
    });
  } else {
    const splatString = toSplit.split(":");
    return { name: splatString[0].trim(), type: splatString[1].trim() };
  }
};
export const fromLineArray = (lineArray: string[]) => {
  return lineArray.join("\n");
};
export const replaceAllInString = (
  str: string,
  find: string | string[],
  replace: string | string[]
) => {
  if (Array.isArray(find) && Array.isArray(replace)) {
    find.forEach((toFind, index) => {
      const escapedFind = toFind.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
      str = str.replace(new RegExp(escapedFind, "g"), replace[index]);
    });
    return str;
  } else if (typeof replace === "string" && typeof find === "string") {
    const escapedFind = find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    return str.replace(new RegExp(escapedFind, "g"), replace);
  } else return "err";
};
export const toImportStatements = (importList: string[]) => {
  return importList.map((typeImport: string) => {
    return `import {${typeImport}} from './';`;
  });
};
// turn ['customTypeFoo', 'fooCustomType', 'fooOptionsCustomType']
// to ["import customTypeFoo from './';", "import fooCustomType from './';"]...
export const capitalizeFirstLetter = (string: string | String) => {
  if (string[0] === "[")
    return "[" + string.charAt(1).toUpperCase() + string.slice(2);
  return string.charAt(0).toUpperCase() + string.slice(1);
};
export const lowercaseFirstLetter = (string: string | String) => {
  if (string[0] === "[")
    return "[" + string.charAt(1).toLowerCase() + string.slice(2);
  return string.charAt(0).toLowerCase() + string.slice(1);
};
export const pushIntoString = (
  stringToPushTo: string,
  handlerA: string | number,
  handlerB: string | number,
  stringToPush: string,
  extraFunc?: any
) => {
  const lineArray = toLineArray(stringToPushTo, (arr: string[]) =>
    arr.map((line) => line.trim())
  );
  // split the stirng to an array of lines, trim each line.
  const startIndex =
    typeof handlerA === "number" ? handlerA : lineArray.indexOf(handlerA) + 1; // The index (line number) in which to push
  const endIndex =
    typeof handlerB === "number" ? handlerB : lineArray.indexOf(handlerB); // The index (line number) in which to stop splicing.
  if (extraFunc) stringToPush = extraFunc(stringToPush);
  lineArray.splice(startIndex, endIndex - startIndex, stringToPush);
  return fromLineArray(lineArray);
};
// params: - string to insert into
// - two handlers to produce a range inside an array of lines,
// - string to push - what to insert?
// - extra function (like parser etc)
export const insertToString = (
  string: string,
  toInsert: string,
  type: string,
  selector: string
) => {
  let handlerA: number;
  const stringLineArray = toLineArray(string, (arr: string[]) =>
    arr.map((line) => line.trim())
  );
  type.toLowerCase() === "mutation" // mutation or query? different line number
    ? (handlerA = stringLineArray.indexOf(`${selector} mutation-end`) - 1)
    : (handlerA = stringLineArray.indexOf(`${selector} query-end`) - 1);
  const handlerB = handlerA;
  return pushIntoString(string, handlerA, handlerB, toInsert);
};
export const removeLastWordFromString = (string: string, word: string[]) => {
  word.forEach((str: string) => {
    let firstIndex = string.indexOf(str);
    const lastIndex = string.lastIndexOf(str);
    if (firstIndex === -1 && !string.includes(str)) {
      return string;
    }
    if (firstIndex !== lastIndex) {
      string = string.substring(0, lastIndex);
    } else if (!string.split(str)[1]) {
      string = string.substring(0, lastIndex);
    }
  });
  return string;
};
