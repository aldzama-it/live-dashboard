const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/src/pages/divisions');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Ensure MonthFilter is imported
      if (!content.includes('MonthFilter')) {
        // Find the last import statement
        const importMatch = [...content.matchAll(/import .* from .*;/g)];
        if (importMatch.length > 0) {
          const lastImport = importMatch[importMatch.length - 1];
          const insertPos = lastImport.index + lastImport[0].length;
          // Determine relative path based on directory depth
          // Since it's in frontend/src/pages/divisions/dept/page.jsx, we need 3 levels up to src
          content = content.slice(0, insertPos) + "\nimport MonthFilter from '../../../components/ui/MonthFilter';" + content.slice(insertPos);
        } else {
          content = "import MonthFilter from '../../../components/ui/MonthFilter';\n" + content;
        }
        modified = true;
      }

      // Inject <MonthFilter /> if not present
      if (!content.includes('<MonthFilter />')) {
        // Try to replace the hardcoded ITSystem block
        if (content.includes('<h2 className="text-2xl font-bold text-boxdark">IT System Dashboard</h2>')) {
          content = content.replace(
            /<div className="flex justify-between items-center mb-6">[\s\S]*?<\/div>/,
            '<div className="flex justify-end mb-6">\n        <MonthFilter />\n      </div>'
          );
        } else {
          // Normal injection
          content = content.replace(
            /return\s*\(\s*<>\s*/,
            'return (\n    <>\n      <div className="flex justify-end mb-6">\n        <MonthFilter />\n      </div>\n      '
          );
        }
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);
console.log('Done!');
