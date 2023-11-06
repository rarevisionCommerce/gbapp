const Quote = require("../models/Quote");

const createQuote = async (req, res) => {
  const { email, name, projectType, description, budget, timeline } = req.body;

  if (!email || !name || !projectType.length || !description || !budget || !timeline)
    return res.status(400).json({ message: "All fields are reuired" });

  try {
    const quote = await Quote.create(req.body);
    if (!quote)
      res.status(400).json({ message: "Invalid quote data received" });

    res
      .status(201)
      .json({
        message: `Quote successfully sent, you will receive an email from us in 1 to 3 working days.`,
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

const getAllQuotes = async (req, res) => {
  const page = req?.query?.page || 1;
  const perPage = req?.query?.perPage || 20;
  const skip = (page - 1) * parseInt(perPage);
  const email = req?.query?.email || "";

  const filters = {
    email: { $regex: email, $options: "i" },
  };
  try {
    const [quotes, count] = await Promise.all([
      Quote.find(filters).limit(parseInt(perPage)).skip(skip).lean().exec(),
      Quote.countDocuments(filters),
    ]);
    if (!quotes?.length) {
      return res.status(200).json({ message: "No quotes found" });
    }

    res.json({ quotes, count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

module.exports = {
    createQuote, 
    getAllQuotes
}
