// pluralize(1, "quote") -> "1 quote"; pluralize(3, "quote") -> "3 quotes"
export const pluralize = (count, noun) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;
