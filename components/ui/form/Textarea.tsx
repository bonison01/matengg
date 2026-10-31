import React from "react";

interface TextareaProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}

const Textarea: React.FC<TextareaProps> = ({ name, value, onChange, placeholder, className }) => {
  return (
    <div className="textarea-wrapper">
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`textarea ${className}`}
      />
    </div>
  );
};

export default Textarea;
