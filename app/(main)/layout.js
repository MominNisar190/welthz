import React from "react";

const MainLayout = ({ children }) => {
  return <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">{children}</div>;
};

export default MainLayout;
