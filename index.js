const core = require('@actions/core');
const sdk = require('matrix-js-sdk');
const md = require('markdown-it')();

try {
  const homeserver = core.getInput('homeserver');
  const channel = core.getInput('channel');
  const token = core.getInput('token');
  const message = core.getInput('message');
  const messagetype = core.getInput('messagetype');
  const threadId = core.getInput('threadId');

  // Debug output
  core.info(`homeserver: ${homeserver}`);
  core.info(`channel: ${channel}`);
  core.info(`token: ${token}`);
  core.info(`message: ${message}`);
  core.info(`messagetype: ${messagetype}`);
  core.info(`threadId: ${threadId}`);

  // Create client object
  const client = sdk.createClient({
    baseUrl: `https://${homeserver}`,
    accessToken: token,
  });

  // Join channel (if we are already in the channel this does nothing)
  client.joinRoom(channel).then(() => {
    core.info('Joined channel');
  });

  // render markdown in message if it doesn't contain HTML.
  let processedMessage = message;
  let plainTextMessage = message;
  if (!message.match(/<[^>]*>/)) {
    processedMessage = md.render(message);
  } else {
    // Strip HTML tags from message
    plainTextMessage = message.replace(/<[^>]*>/g, '');
  }

  // Send message
  const content = {
    msgtype: messagetype,
    format: 'org.matrix.custom.html',
    body: plainTextMessage,
    formatted_body: processedMessage,
  };

  client.sendEvent(channel, threadId.length > 0 ? threadId : null, 'm.room.message', content, '').then((event) => {
    core.setOutput('eventId', event.event_id);
  // message sent successfully
  }).catch((err) => {
    core.error(err);
  });
} catch (error) {
  core.setFailed(error.message);
}
