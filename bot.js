const express = require("express");
const { connectDB } = require("./apps/config/database");
const {
  authMiddleware,
  isAdmin,
  isSuperAdmin,
  isDev,
} = require("./apps/middlewares/auth");
const seedUsers = require("./apps/seeders/seed");
const { User } = require("./apps/models");
const wppconnect = require("@wppconnect-team/wppconnect");
const { handleIncomingMessage } = require("./apps/controllers/chatController");
const { modifyPsdAndSave } = require("./apps/controllers/psdController"); // Pastikan path ini benar
const path = require("path");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("WhatsApp Bot is running");
});

app.post("/admin", authMiddleware, isAdmin, (req, res) => {
  res.send("Hello Admin");
});

app.post("/superadmin", authMiddleware, isSuperAdmin, (req, res) => {
  res.send("Hello SuperAdmin");
});

app.post("/dev", authMiddleware, isDev, (req, res) => {
  res.send("Hello Developer");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await connectDB();
  await seedUsers();
  console.log(`Server is running on port ${PORT}`);

  wppconnect
    .create()
    .then(async (client) => {
      console.log("WhatsApp client created");
      client.onMessage(async (message) => {
        try {
          const response = await handleIncomingMessage(message, client);
          if (response) {
            console.log("Sending response:", response);
            if (message.isGroupMsg) {
              await client.reply(message.from, response, message.id.toString());
            } else {
              await client.sendText(message.from, response);
            }
          }
        } catch (error) {
          console.error("Error handling incoming message:", error);
        }
      });

      // client.onParticipantsChanged(async (event) => {
      //   if (event.action === "add") {
      //     const newUser = event.who[0]; // Ambil pengguna baru dari array
      //     const username = newUser.split("@")[0];
      //     const outputPath = path.join(__dirname, "output", "welcome.png");

      //     try {
      //       await modifyPsdAndSave(username);
      //       await client.sendImage(
      //         event.chat,
      //         outputPath,
      //         "welcome.png",
      //         `Welcome to the group, @${username}!`
      //       );
      //     } catch (error) {
      //       console.error("Error sending welcome image:", error);
      //     }
      //   }
      // });

      const devUsers = await User.findAll({ where: { type: "dev" } });
      if (devUsers.length > 0) {
        const devNumbers = devUsers.map((dev) => dev.number);
        const uniqueDevNumbers = [...new Set(devNumbers)];

        uniqueDevNumbers.forEach((devNumber) => {
          if (typeof client.sendText === "function") {
            client.sendText(devNumber, "Bot telah menyala!");
          } else {
            console.log("sendText method is not available on client object");
          }
        });
      }
    })
    .catch((error) => {
      console.error("Error creating WhatsApp client:", error);
    });
});
