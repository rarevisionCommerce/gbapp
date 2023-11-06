const Message = require("../models/Message");

const sendMessage = async (req, res) => {
  const { email, message, } = req.body;

  if (!email || !message)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const messageDoc = await Message.create(req.body);

    if (!messageDoc)
      return res.status(400).json({ message: "Invalid message data" });

    res.status(201).json({ message: "Message sent." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

const getAllMessages = async (req, res) => {
  const page = req?.query?.page || 1;
  const perPage = req?.query?.perPage || 20;
  const skip = (page - 1) * parseInt(perPage);

  try {
    const [messages, count] = await Promise.all([
      Message.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(perPage))
        .skip(skip)
        .lean()
        .exec(),
      Message.countDocuments(),
    ]);
    if (!messages?.length) {
      return res.status(200).json({ message: "No messages found" });
    }

    res.json({ messages, count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: `Something went wrong!!` });
  }
};

module.exports = {
    sendMessage,
    getAllMessages
}
