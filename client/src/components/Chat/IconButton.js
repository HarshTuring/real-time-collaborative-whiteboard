import React from 'react';
import './IconButton.css';

const IconButton = ({ icon, onClick, label, badge = null }) => {
    return (
        <button>
            {icon}
            {badge !== null && (
                <span>
                    {badge > 99 ? '99+' : badge}

                </span>
            )}
        </button>
    );
};

export default IconButton;