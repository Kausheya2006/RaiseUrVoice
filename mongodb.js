const mongoose = require("mongoose");

// MongoDB connection
mongoose
  .connect("mongodb+srv://Anubhab:anubhab2612@reports-database.qfdgo.mongodb.net/?retryWrites=true&w=majority&appName=Reports-Database")
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
  });

// Define the schema for reporting issues
const IssueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  aadhar: { type: String, required: true },
  issue: { type: String, required: true },
  area: { type: String, required: true },
  images: [
    {
      filename: { type: String, required: true },
      contentType: { type: String, required: true },
      data: { type: String, required: true }, // Base64-encoded image data
    },
  ],
});

// Define the model
const collection = mongoose.model("IssueReports", IssueSchema,"test");

// Export the model for use in other files
module.exports = collection;
