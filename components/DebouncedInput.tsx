"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

export function DebouncedInput({
  value: externalValue,
  onChange,
  delay = 300,
  ...props
}: { value: string; onChange: (value: string) => void; delay?: number } & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  const [value, setValue] = useState(externalValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setValue(externalValue);
  }, [externalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onChange(newValue), delay);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return <Input value={value} onChange={handleChange} {...props} />;
}
