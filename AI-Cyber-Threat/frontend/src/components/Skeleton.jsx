import React from 'react';

const Skeleton = ({ className = '' }) => {
  return (
    <div className={`skeleton rounded-md min-h-[1.5rem] w-full ${className}`}></div>
  );
};

export default Skeleton;
