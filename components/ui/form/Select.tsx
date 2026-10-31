import React from "react";

interface SelectProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string }[];
  className?: string;
}

const Select: React.FC<SelectProps> = ({ name, value, onChange, options, className }) => {
  return (
    <div className="select-wrapper">
      <select name={name} value={value} onChange={onChange} className={`select ${className}`}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
