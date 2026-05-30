import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  endIcon?: React.ReactNode;
  onEndIconClick?: () => void;
}

const Input: React.FC<InputProps> = ({ label, endIcon, onEndIconClick, ...props }) => {
  const id = useId();
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div className="relative">
        <input
          id={id}
          className={`w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${endIcon ? 'pr-10' : ''}`}
          {...props}
        />
        {endIcon && (
          <button
            type="button"
            onClick={onEndIconClick}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
            aria-label="Toggle password visibility"
          >
            {endIcon}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;