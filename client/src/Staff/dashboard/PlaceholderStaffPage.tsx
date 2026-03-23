import React from 'react';

const PlaceholderStaffPage: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="p-8 bg-[#f5f5f5] min-h-screen font-sans flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-black text-[#003580] mb-4">{title} STAFF</h1>
        <p className="text-gray-500 font-medium italic">Trang giao diện đang được hoàn thiện...</p>
      </div>
    </div>
  );
};

export default PlaceholderStaffPage;
