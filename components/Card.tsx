
import React, { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white shadow-lg rounded-lg p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">{title}</h3>
      {children}
    </div>
  );
};

export default Card;
