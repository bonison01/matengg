import React from "react";

interface FormButtonProps {
  type: "submit" | "reset" | "button";
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const FormButton: React.FC<FormButtonProps> = ({ type, onClick, children, className }) => {
  return (
    <button type={type} onClick={onClick} className={`form-button ${className}`}>
      {children}
    </button>
  );
};

export default FormButton;
