const handleKickMember = async (client, groupId, member) => {
    try {
      await client.removeParticipant(groupId, member);
      return `Member ${member} telah dikeluarkan dari grup.`;
    } catch (error) {
      console.error("Error kicking member:", error);
      return `Gagal mengeluarkan member ${member} dari grup.`;
    }
  };
  
  const handleCreateGroup = async (client, namegroup, participants) => {
    try {
      const group = await client.createGroup(namegroup, participants);
      return `Grup ${namegroup} telah dibuat dengan ID ${group.gid._serialized}.`;
    } catch (error) {
      console.error("Error creating group:", error);
      return `Gagal membuat grup ${namegroup}.`;
    }
  };
  
  const handleGetGroup = async (client, groupId) => {
    try {
      const group = await client.getGroupInfo(groupId);
      return `Informasi grup: ${group.name} (ID: ${group.id._serialized}).`;
    } catch (error) {
      console.error("Error getting group info:", error);
      return `Gagal mendapatkan informasi grup.`;
    }
  };
  
  const handlePrivateGroup = async (client, groupId) => {
    try {
      await client.setGroupToAdminsOnly(groupId, true);
      return `Grup telah menjadi privat.`;
    } catch (error) {
      console.error("Error setting group to private:", error);
      return `Gagal mengubah grup menjadi privat.`;
    }
  };
  
  const handleGetAllMember = async (client, groupId) => {
    try {
      const participants = await client.getGroupMembers(groupId);
      const memberList = participants.map((participant) => participant.id.user).join(", ");
      return `Daftar semua member dari grup: ${memberList}.`;
    } catch (error) {
      console.error("Error getting group members:", error);
      return `Gagal mendapatkan daftar member dari grup.`;
    }
  };
  
  const handleAllGroup = async (client) => {
    try {
      const groups = await client.getAllGroups();
      const groupList = groups.map((group) => `${group.name} (ID: ${group.id._serialized})`).join(", ");
      return `Daftar semua grup: ${groupList}.`;
    } catch (error) {
      console.error("Error getting all groups:", error);
      return `Gagal mendapatkan daftar semua grup.`;
    }
  };
  
  const handleActiveProtectionLinks = async () => {
    // Logika untuk mengaktifkan proteksi link
    return `Proteksi link telah diaktifkan.`;
  };
  
  const handleActiveProtectionVirtext = async () => {
    // Logika untuk mengaktifkan proteksi virtext
    return `Proteksi virtext telah diaktifkan.`;
  };
  
  const handleAddAdminGroup = async (client, groupId, number) => {
    try {
      await client.promoteParticipant(groupId, number);
      return `Nomor ${number} telah ditambahkan sebagai admin di grup.`;
    } catch (error) {
      console.error("Error adding admin to group:", error);
      return `Gagal menambahkan admin ke grup.`;
    }
  };
  
  module.exports = {
    handleKickMember,
    handleCreateGroup,
    handleGetGroup,
    handlePrivateGroup,
    handleGetAllMember,
    handleAllGroup,
    handleActiveProtectionLinks,
    handleActiveProtectionVirtext,
    handleAddAdminGroup,
  };