// Layout.jsx - Parent component that manages sidebar state
import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const Layout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Listen for sidebar toggle events from header
  useEffect(() => {
    const handleSidebarToggle = () => {
      toggleSidebar();
    };

    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, [isSidebarCollapsed]); // Include dependency to ensure latest state

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
      />
      
      {/* Main content area */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Header */}
        <Header 
          isSidebarCollapsed={isSidebarCollapsed} 
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
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