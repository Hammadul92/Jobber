import { useEffect, useRef, useState } from "react";

// Keep typing synchronous, like useServerTable, while persisting settled search
// to the URL. Router transitions must never control an in-progress keystroke.
export default function useURLSearch(value, onCommit) {
  const [input, setInput] = useState(value);
  const committed = useRef(value);
  const timer = useRef(null);
  const commit = useRef(onCommit);
  useEffect(() => {
    commit.current = onCommit;
  }, [onCommit]);
  useEffect(() => {
    if (value !== committed.current) {
      clearTimeout(timer.current);
      committed.current = value;
      setInput(value);
    }
  }, [value]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const change = (next) => {
    setInput(next);
    clearTimeout(timer.current);
    const apply = () => {
      committed.current = next.trim();
      commit.current(next.trim());
    };
    if (!next) apply();
    else timer.current = setTimeout(apply, 300);
  };
  return [input, change];
}
