import React from 'react';
import './RoomCard.css';

const RoomCard = ({ room, onClick }) => {
  return (
    <div className="room-card" onClick={onClick}>
      <h3 className="room-card-title">
        {room.name}
      </h3>
      <div className="room-card-info">
        <p className="room-participants">
          <i className="user-icon"></i>
          {room.participantCount || 0} participants
        </p>
        <p className="room-created">
          Created {new Date(room.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default RoomCard;