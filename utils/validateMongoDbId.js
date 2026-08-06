const validateMongoDbId = (id) => {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(String(id || ""))) {
    throw new Error("This id is not valid or not found");
  }
};

module.exports = validateMongoDbId;
