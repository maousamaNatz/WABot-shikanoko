const { User } = require('../models');

const seedUsers = async () => {
  const users = [
    {
      username: 'Developer',
      number: '6281910058235@c.us', // ganti dengan nomor WhatsApp dev yang sebenarnya dalam format internasional
      type: 'dev',
    },
  ];

  for (const user of users) {
    const existingUser = await User.findOne({ where: { number: user.number } });
    if (!existingUser) {
      await User.create(user);
      console.log(`User ${user.username} seeded!`);
    } else {
      console.log(`User with number ${user.number} already exists. Skipping.`);
    }
  }
};

module.exports = seedUsers;
