import { useEffect, useState } from "react";

function useDebounce(value: any, delay: number) {
  let [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    let handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
