const mongoose = require("mongoose");

const foodLogSchema = new mongoose.Schema({
  food: String,
  calories: Number,
  protein_g: Number,
  carbs_g: Number,
  fat_g: Number,
  sugar_rise: Number,
  portion_g: Number,
  date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  foodLogs: [foodLogSchema]
});

const User = mongoose.model("User", userSchema);

module.exports = User;
