import React from 'react'
import "./productBanner.css"

export default function ProductBanner() {
  return (
    <div>
    <div className="wrap_card">
      <div className="card">
        <div className="content">
          <img src="./product.jpg" alt="img" />
        </div>
      </div>
      <div className="card">
        <div className="content">
        <img src="./product2.jpg" alt="img" />
        </div>
      </div>
      <div className="card">
        <div className="content">
        <img src="./product3.jpg" alt="img" />
        </div>
      </div>
    
      <div className="lines">
        <div className="line"></div>
        <div className="line"></div>
      </div>
    </div>
    </div>
  )
}
