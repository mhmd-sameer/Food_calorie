require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log("Connected to DB, clearing foodLogs...");
    const res = await User.updateMany({}, { $set: { foodLogs: [] } });
    console.log(`Cleared logs for ${res.modifiedCount} users.`);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
