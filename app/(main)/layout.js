import React from "react";

const MainLayout = ({ children }) => {
  return <div className="container mx-auto px-4 pt-16 pb-8 sm:px-6 lg:px-8 lg:pt-20 lg:pb-16">{children}</div>;
};

export default MainLayout;
