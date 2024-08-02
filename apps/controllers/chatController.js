const { User } = require("../models");
const {
  handleUserCommand,
  handleEveryoneCommand,
  getBotInfoResponse,
  handleDownloadCommand,
} = require("./userController");
const { handleStickerCommand } = require("./stickerController");
const {
  getHelloMessage,
  handleMoreInfoCommand,
  getFeatureHelp,
} = require("./infoController");
const { handleMalCommand } = require("./MalController");
const { searchWikipedia, summarizeContent } = require("./wikiController");
const path = require("path");
const processedMessages = new Set();

const handleIncomingMessage = async (message, client) => {
  const messageId = message.id;
  if (processedMessages.has(messageId)) {
    console.log(`Message ID ${messageId} already processed.`);
    return;
  }

  processedMessages.add(messageId);

  const number = message.from;
  const groupId = message.chatId || message.from;
  const senderId = message.author || message.from;
  const senderName =
    (message.sender && (message.sender.pushname || message.sender.verifiedName)) || "Pengguna";
  const isGroupMessage = groupId.endsWith("@g.us");
  let response = "";

  console.log(`Message ID: ${messageId}`);
  console.log(`Number: ${number}`);
  console.log(`Sender Name: ${senderName}`);

  const lowerCaseBody = message.body ? message.body.toLowerCase() : "";

  let user = null;
  if (!isGroupMessage) {
    user = await User.findOne({ where: { number } });
    console.log(`User found: ${JSON.stringify(user)}`);
  }

  const userName = user ? user.username : senderName;

  if (isGroupMessage) {
    if (lowerCaseBody === "@everyone") {
      response = await handleEveryoneCommand(client, groupId, senderId);
    } else if (lowerCaseBody.startsWith("help ")) {
      const feature = lowerCaseBody.split(" ")[1];
      response = getFeatureHelp(feature);
    } else if (lowerCaseBody === "./more-info") {
      response = await handleMoreInfoCommand();
    } else if (lowerCaseBody === "!info") {
      response = getHelloMessage(userName);
    }
  }

  if (!isGroupMessage) {
    if (lowerCaseBody === "!user") {
      response = await handleUserCommand(client, number, user);
    } else if (lowerCaseBody === "!info") {
      response = getHelloMessage(userName);
    } else if (lowerCaseBody === "./owner") {
      response = handleOwnerCommand();
    } else if (lowerCaseBody === "./profil") {
      response = await handleProfileCommand(user);
    }
  } 

  if (!response) {
    if (message.caption && message.caption.startsWith("./sticker")) {
      await handleStickerCommand(client, message);
    } else if (lowerCaseBody.startsWith("./download ")) {
      await handleDownloadCommand(client, message);
    } else if (lowerCaseBody === "./more-info") {
      response = await handleMoreInfoCommand();
    } else if (lowerCaseBody.startsWith("help ")) {
      const feature = lowerCaseBody.split(" ")[1];
      response = getFeatureHelp(feature);
    } else if (lowerCaseBody.startsWith("./mal-")) {
      await handleMalCommand(client, message, lowerCaseBody.slice(2));
      return;
    } else if (lowerCaseBody.startsWith("./wiki ")) {
      const query = lowerCaseBody.replace("./wiki ", "");
      const searchResult = await searchWikipedia(query, 'id');
      response = `Berikut adalah hasil pencarian kami:\n\nHeader: ${searchResult.title}\nReferensi: ${searchResult.url}\n\nKonten:\n${searchResult.content}`;
    } else if (lowerCaseBody.startsWith("./wiki-en ")) {
      const query = lowerCaseBody.replace("./wiki-en ", "");
      const searchResult = await searchWikipedia(query, 'en');
      response = `Here are the search results:\n\nHeader: ${searchResult.title}\nReference: ${searchResult.url}\n\nContent:\n${searchResult.content}`;
    } else if (lowerCaseBody.startsWith("./wiki-ran ")) {
      const query = lowerCaseBody.replace("./wiki-ran ", "");
      const searchResult = await searchWikipedia(query, 'id');
      const summary = summarizeContent(searchResult.content);
      response = `Berikut adalah hasil rangkuman kami:\n\nHeader: ${searchResult.title}\nReferensi: ${searchResult.url}\n\nKonten:\n${summary}`;
    } else if (lowerCaseBody.startsWith("./wiki-ran-en ")) {
      const query = lowerCaseBody.replace("./wiki-ran-en ", "");
      const searchResult = await searchWikipedia(query, 'en');
      const summary = summarizeContent(searchResult.content);
      response = `Here is the summary:\n\nHeader: ${searchResult.title}\nReference: ${searchResult.url}\n\nContent:\n${summary}`;
    }
  }

  if (response && client && typeof client.sendText === "function") {
    console.log(`Sending response to: ${isGroupMessage ? groupId : number}`);
    if (isGroupMessage) {
      await client.reply(groupId, response, message.id.toString());
    } else {
      await client.sendText(number, response);
    }
  }

  processedMessages.delete(messageId);
};

module.exports = {
  handleIncomingMessage,
};
