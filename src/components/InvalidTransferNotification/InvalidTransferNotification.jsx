import React from 'react';

const InvalidTransferNotification = props => {
  const {
    notificationContext: { channelType, queueName }
  } = props;

  return (
    <div>
      You cannot transfer a task of "{channelType}" type to the queue "{queueName}"
    </div>
  );
};

export default InvalidTransferNotification;
