import React from "react";

interface CheckboxProps {
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ name, checked, onChange, label, className }) => {
  return (
    <div className="checkbox-wrapper">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className={`checkbox ${className}`}
      />
      <label htmlFor={name}>{label}</label>
    </div>
  );
};

export default Checkbox;
