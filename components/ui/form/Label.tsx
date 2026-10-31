import React from "react";

interface LabelProps {
  children: React.ReactNode;
  htmlFor: string;
  className?: string;
}

const Label: React.FC<LabelProps> = ({ children, htmlFor, className }) => {
  return (
    <label htmlFor={htmlFor} className={`label ${className}`}>
      {children}
    </label>
  );
};

export default Label;
