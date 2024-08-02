const { User } = require("../models");
const { downloadMedia } = require('../helpers/downloadHelpers');
const fs = require("fs");
const path = require("path");
const { mediaStoragePath } = require('../config/Mpath');


const handleUserCommand = async (client, number, user) => {
  if (user.type === "dev") {
    const users = await User.findAll();

    const admins = users.filter((u) => u.type === "admin");
    const superadmins = users.filter((u) => u.type === "superadmin");
    const regularUsers = users.filter((u) => u.type === "user");

    let response = "";

    if (admins.length > 0) {
      response += "Admin:\n";
      admins.forEach((admin, index) => {
        response += `${index + 1}. ${admin.username} (${admin.number})\n`;
      });
    } else {
      response += "Tidak ada admin\n";
    }

    if (superadmins.length > 0) {
      response += "Superadmin:\n";
      superadmins.forEach((superadmin, index) => {
        response += `${index + 1}. ${superadmin.username} (${superadmin.number})\n`;
      });
    } else {
      response += "Tidak ada superadmin\n";
    }

    if (regularUsers.length > 0) {
      response += "User:\n";
      regularUsers.forEach((user, index) => {
        response += `${index + 1}. ${user.username} (${user.number})\n`;
      });
    } else {
      response += "Tidak ada user\n";
    }

    return response;
  } else {
    return "Hanya dev yang dapat meminta daftar pengguna";
  }
};

const handleEveryoneCommand = async (client, groupId, senderId) => {
  try {
    // Get group participants
    const participants = await client.getGroupMembers(groupId);
    // console.log('Group participants:', participants);

    // Get group admins
    const groupAdmins = await client.getGroupAdmins(groupId);
    const isAdminInGroup = groupAdmins.some(admin => admin._serialized === senderId);
    console.log('Is sender admin in group:', isAdminInGroup);

    if (!isAdminInGroup) {
      return 'Hanya admin grup yang dapat menggunakan perintah ini.';
    }

    let mentions = "";
    participants.forEach(participant => {
      mentions += `@${participant.id.user} `;
    });

    // Ensure sendTextWithMentions function is available on the client
    if (typeof client.sendTextWithMentions === 'function') {
      await client.sendTextWithMentions(groupId, mentions);
    } else {
      console.log('sendTextWithMentions method is not available on client object');
      await client.sendText(groupId, mentions); // Use sendText as fallback
    }
    // return "Tag everyone berhasil!";
  } catch (error) {
    console.error("Error handling @everyone command:", error);
    return "Terjadi kesalahan saat memanggil semua user.";
  }
};

const handleDownloadCommand = async (client, message) => {
  const url = message.body.replace('./download ', '').trim();

  try {
    const fileName = await downloadMedia(url);
    const fileType = path.extname(fileName).includes('mp4') ? 'video' : 'image';
    if (message.isGroupMsg) {
      await client.sendFile(message.from, fileName, path.basename(fileName), `Here is your ${fileType}`, message.id);
    } else {
      await client.sendFile(message.from, fileName, path.basename(fileName), `Here is your ${fileType}`);
    }
  } catch (error) {
    console.error('Error downloading media:', error);
    await client.sendText(message.from, 'Failed to download media: ' + error.message);
  }
};

module.exports = {
  handleEveryoneCommand,
  handleUserCommand,
  handleDownloadCommand
};
