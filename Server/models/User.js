const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  sugar: Number
});