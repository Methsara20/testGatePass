// Layout.jsx - Parent component that manages sidebar state
import React, { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const Layout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
      />
      
      {/* Main content area */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Header */}
        <Header 
          isSidebarCollapsed={isSidebarCollapsed} 
          toggleSidebar={toggleSidebar} 
        />
        
        {/* Page content */}
        <main className="flex-grow-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;