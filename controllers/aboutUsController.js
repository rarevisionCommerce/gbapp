const AboutUs = require("../models/AboutUs");

const updateAboutUs = async (req, res) => {
  const { content, showContent } = req.body;

  if (!content )
    return res.status(400).json({ message: "All fields are required" });

  try {
    const aboutUs = await AboutUs.find().exec();

    if (!aboutUs.length) {
      await AboutUs.create(req.body);
      return res.status(201).json({ message: "About us content added." });
    }

    const aboutUsToBeUpdated = await AboutUs.findByIdAndUpdate(
      aboutUs[0]._id,
      { content, showContent },
      { new: true }
    ).exec();

    if (!aboutUsToBeUpdated)
      return res.status(404).json({ message: "Document not found" });

    res.status(200).json({ message: "About us content updated." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

const getAboutUs = async (req, res) => {
  try {
    const aboutUs = await AboutUs.find().exec();
    res.status(200).json(aboutUs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

module.exports = {
  updateAboutUs,
  getAboutUs,
};
