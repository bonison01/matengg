import React from 'react'
import './wordFlipLoader.css'

export default function WordFlipLoader() {
    return (
        <div className='flex flex-row justify-center gap-6 items-center w-full'>
            <div className="loader-box">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>

            <div className="loader-word">
                <p>loading</p>
                <div className="words">
                    <span className="word">webstores</span>
                    <span className="word">stores</span>
                    <span className="word">merchandise</span>
                    <span className="word">services</span>
                    <span className="word">products</span>
                </div>
            </div>
        </div>
    )
}
