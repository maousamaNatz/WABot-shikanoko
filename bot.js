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
const path = require("path");
const fs = require("fs");
const {
  handleKickMember,
  handleCreateGroup,
  handleGetGroup,
  handlePrivateGroup,
  handleGetAllMember,
  handleAllGroup,
  handleActiveProtectionLinks,
  handleActiveProtectionVirtext,
  handleAddAdminGroup,
} = require("./apps/controllers/groupController");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

app.post("/edit-profile-bot", authMiddleware, isDev, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (req.files && req.files.profileImage) {
      const profileImage = req.files.profileImage;
      const uploadPath = path.join(__dirname, "uploads", profileImage.name);
      await profileImage.mv(uploadPath);

      const response = await editBotProfile(name, description, uploadPath);
      fs.unlinkSync(uploadPath);  // Delete image after upload
      res.send(response);
    } else {
      res.status(400).send("No profile image uploaded");
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.post("/kick", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { member } = req.body;
    const response = await handleKickMember(member);
    res.send(response);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.post("/create-group", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { namegroup } = req.body;
    const response = await handleCreateGroup(namegroup);
    res.send(response);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.post("/get-group", authMiddleware, isAdmin, async (req, res) => {
  try {
    const response = await handleGetGroup();
    res.send(response);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.post("/private-group", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { namegroup } = req.body;
    const response = await handlePrivateGroup(namegroup);
    res.send(response);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.post("/get-all-member", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { namegroup } = req.body;
    const response = await handleGetAllMember(namegroup);
    res.send(response);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.post("/all-group", authMiddleware, isAdmin, async (req, res) => {
  try {
    const response = await handleAllGroup();
    res.send(response);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.post("/active-protection-links", authMiddleware, isAdmin, async (req, res) => {
  try {
    const response = await handleActiveProtectionLinks();
    res.send(response);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.post("/active-protection-virtext", authMiddleware, isAdmin, async (req, res) => {
  try {
    const response = await handleActiveProtectionVirtext();
    res.send(response);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.post("/add-admin-group", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { number, namegroup } = req.body;
    const response = await handleAddAdminGroup(number, namegroup);
    res.send(response);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
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