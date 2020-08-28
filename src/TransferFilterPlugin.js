import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';

import reducers, { namespace } from './states';
import InvalidTransferNotification from './components/InvalidTransferNotification';

const PLUGIN_NAME = 'TransferFilterPlugin';

export default class TransferFilterPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    this.registerReducers(manager);

    flex.Notifications.registerNotification({
      id: 'invalidTransferNotification',
      content: <InvalidTransferNotification />,
      type: flex.NotificationType.warning
    });

    const isValidTransfer = (channelType, queueName) =>
      (channelType === 'voice' && queueName.startsWith('VOICE')) ||
      (channelType === 'email' && queueName.startsWith('EMAIL'));

    flex.Actions.replaceAction('TransferTask', async (payload, original) => {
      const { task, targetSid } = payload;
      const { channelType } = task;

      // Direct transfers to agents will ignore this verification
      if (!targetSid.startsWith('WQ')) {
        return original(payload);
      }

      const liveQuery = await manager.insightsClient.liveQuery(
        'tr-queue',
        `data.queue_sid == "${targetSid}"`
      );

      const [data] = Object.values(liveQuery.getItems());
      const { queue_name: queueName } = data;

      if (isValidTransfer(channelType, queueName)) {
        original(payload);
      } else {
        flex.Notifications.showNotification('invalidTransferNotification', {
          channelType,
          queueName
        });
      }

      liveQuery.close();
    });
  }

  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint: disable-next-line
      console.error(
        `You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`
      );
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}
