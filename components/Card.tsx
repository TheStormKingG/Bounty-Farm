import React, { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`modern-card p-6 ${className}`}>
      <h3 className="heading-tertiary text-[#333333] mb-6 border-b border-[#F5F0EE] pb-4">{title}</h3>
      {children}
    </div>
  );
};

export default Card;