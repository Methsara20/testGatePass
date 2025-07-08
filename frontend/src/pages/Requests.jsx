import React from 'react'
import Sidebar from '../components/Sidebar';

function Requests() {
  return (
    <div className="d-flex">
    
        <Sidebar />
        <div className="container mt-4">
            <h2>Requests Page</h2>
            <p>This is where you can manage your requests.</p>
            {/* Add your request management components here */}
        </div>
    </div>
  )
}

export default Requests