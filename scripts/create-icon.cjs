// Generates a 128×128 solid-colour PNG as a placeholder plugin icon.
// Requires: npm install (jimp is in devDependencies)
// Run with:  npm run create-icon
const Jimp = require("jimp");

Jimp.create(128, 128, 0x4a7fe8ff) // solid blue #4a7fe8
  .then((img) => img.writeAsync("icon.png"))
  .then(() =>
    console.log(
      "Created icon.png (128×128 blue placeholder). " +
      "Replace with a proper icon before submitting to the marketplace."
    )
  )
  .catch(console.error);
