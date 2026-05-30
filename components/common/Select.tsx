import React, { useId } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, children, ...props }) => {
  const id = useId();
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <select
        id={id}
        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;