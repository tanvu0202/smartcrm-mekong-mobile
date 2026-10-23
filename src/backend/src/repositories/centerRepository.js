const centerRepository = {
  async findAll(db) {
    const { rows } = await db.query('SELECT center_id, name, address, phone FROM service_center ORDER BY center_id');
    return rows;
  },
};
module.exports = centerRepository;
