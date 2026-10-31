import React from "react";
import { Label } from "@/components/ui/form"; // Import Label from the form directory

interface FormGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

const FormGroup: React.FC<FormGroupProps> = ({ label, children, className }) => {
  return (
    <div className={`form-group ${className}`}>
      <Label htmlFor={label}>{label}</Label>
      {children}
    </div>
  );
};

export default FormGroup;
