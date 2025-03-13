/**
 * Setup script to create the project directory structure
 */

const fs = require("fs-extra");
const path = require("path");

// Ensure the src/data/input and src/data/output directories exist
const srcDirectory = path.join(__dirname, "..", "src");
const dataDirectory = path.join(srcDirectory, "data");
const inputDirectory = path.join(dataDirectory, "input");
const outputDirectory = path.join(dataDirectory, "output");

// Create directories
console.log("Creating project directories...");
fs.ensureDirSync(srcDirectory);
fs.ensureDirSync(dataDirectory);
fs.ensureDirSync(inputDirectory);
fs.ensureDirSync(outputDirectory);

console.log("Project directories created:");
console.log(`- ${srcDirectory}`);
console.log(`- ${dataDirectory}`);
console.log(`- ${inputDirectory}`);
console.log(`- ${outputDirectory}`);

// Create a README file in the input directory explaining what files to place there
const inputReadmePath = path.join(inputDirectory, "README.md");
const inputReadmeContent = `# Input Data Directory

Place your CSV data files in this directory. The agent expects the following files:

- \`ai.testSessions.csv\` / \`ai.controlSessions.csv\`
- \`ai.testLeads.csv\` / \`ai.controlLeads.csv\`
- \`ai.testContacts.csv\` / \`ai.controlContacts.csv\`
- \`ai.testContacts2Leads.csv\` / \`ai.controlContacts2Leads.csv\`
- \`ai.testTransactions.csv\` / \`ai.controlTransactions.csv\`
- \`ai.testSourceData.csv\` / \`ai.controlSourceData.csv\`
- \`ai.testAtom.csv\` / \`ai.controlAtoms.csv\`

The test files are used for the current analysis, while the control files represent historical data for comparison.
`;

fs.writeFileSync(inputReadmePath, inputReadmeContent);
console.log(`Created README at ${inputReadmePath}`);

// Update package.json to include setup script
const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = require(packageJsonPath);

if (!packageJson.scripts.setup) {
  packageJson.scripts.setup = "node scripts/setup.js";
  fs.writeJSONSync(packageJsonPath, packageJson, { spaces: 2 });
  console.log("Added setup script to package.json");
}

console.log("\nSetup completed successfully! 🚀");
console.log("\nNext steps:");
console.log('1. Run "npm install" to install dependencies');
console.log("2. Set your OpenAI API key in .env file");
console.log("3. Add your data files to src/data/input/");
console.log('4. Run "npm start" to generate a daily brief');
