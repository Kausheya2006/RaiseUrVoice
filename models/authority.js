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

// Define the Authority schema
const authoritySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  honourScore: {
    type: Number,
    required: true,
    default: 0,
  },
});

// Create the Authority model
const Authority = mongoose.model("Authority", authoritySchema,"login_govt_authorities");

module.exports = Authority;
